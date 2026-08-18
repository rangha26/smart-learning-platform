from fastapi import APIRouter, Depends, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.classes.router import _ensure_can_view_class, _get_class_or_404
from app.core import BadRequestException, ForbiddenException, NotFoundException
from app.db import get_db
from app.models import Class, Comment, Post, User, UserRole, Attachment
from app.schemas import (
    CommentCreateRequest,
    CommentResponse,
    PostResponse,
    UserSummaryResponse,
    PostCreateRequest
)
from fastapi import File, Form, UploadFile
from typing import Optional
from app.core.supabase import upload_file_to_supabase
from app.ai_chat.services.background_tasks import embed_post_in_background
from app.core.utils import sanitize_html

router = APIRouter(tags=["Posts"])


def _ensure_can_post(class_: Class, user: User) -> None:
    if user.role == UserRole.ADMIN:
        return
    if user.role == UserRole.INSTRUCTOR and class_.instructor_id == user.id:
        return
    raise ForbiddenException("Only the class instructor can create announcements.")


def _comment_response(comment: Comment) -> CommentResponse:
    return CommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        parent_id=comment.parent_id,
        content=comment.content,
        created_at=comment.created_at,
        author=UserSummaryResponse.model_validate(comment.user),
        author_role=comment.user.role,
        replies=[],
    )


def _build_comment_tree(comments: list[Comment]) -> list[CommentResponse]:
    nodes: dict[int, CommentResponse] = {comment.id: _comment_response(comment) for comment in comments}
    roots: list[CommentResponse] = []
    for comment in comments:
        node = nodes[comment.id]
        if comment.parent_id and comment.parent_id in nodes:
            nodes[comment.parent_id].replies.append(node)
        else:
            roots.append(node)
    return roots


def _post_response(post: Post, comments: list[Comment], attachments: list[Attachment] = None) -> PostResponse:
    if attachments is None:
        # Fallback to relationship if not explicitly provided
        attachments = getattr(post, "attachments", [])

    return PostResponse(
        id=post.id,
        class_id=post.class_id,
        content=post.content,
        created_at=post.created_at,
        author=UserSummaryResponse.model_validate(post.author),
        author_role=post.author.role,
        comments=_build_comment_tree(comments),
        attachments=attachments,
    )


def _get_post_or_404(db: Session, post_id: int) -> Post:
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise NotFoundException("Post not found.")
    return post


@router.post(
    "/classes/{class_id}/posts",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_post(
    class_id: int,
    payload: PostCreateRequest,
    background_tasks: BackgroundTasks,
    content: str = Form(""),
    files: Optional[list[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    class_ = _get_class_or_404(db, class_id)
    _ensure_can_view_class(db, class_, current_user)
    _ensure_can_post(class_, current_user)

    if not content.strip() and not files:
        raise BadRequestException("Post must have content or at least one attachment.")

    cleaned_content = sanitize_html(payload.content)
    post = Post(class_id=class_id, author_id=current_user.id, content=cleaned_content)
    db.add(post)
    db.commit()
    db.refresh(post)

    # Handle attachments
    file_urls_for_ai = []
    file_names_for_ai = []
    if files:
        for f in files:
            file_url = await upload_file_to_supabase(f, folder="posts")
            attachment = Attachment(
                post_id=post.id,
                file_url=file_url,
                file_name=f.filename,
                file_type=f.content_type
            )
            db.add(attachment)
            file_urls_for_ai.append(file_url)
            file_names_for_ai.append(f.filename)
        db.commit()

    # Ném tác vụ AI nhúng tài liệu vào Background để không chặn API
    background_tasks.add_task(
        embed_post_in_background,
        class_id=class_id,
        post_id=post.id,
        content=post.content,
        file_urls=file_urls_for_ai,
        file_names=file_names_for_ai
    )

    return _post_response(post, [], getattr(post, "attachments", []))


@router.get("/classes/{class_id}/posts", response_model=list[PostResponse])
def get_class_posts(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    class_ = _get_class_or_404(db, class_id)
    _ensure_can_view_class(db, class_, current_user)

    posts = (
        db.query(Post)
        .filter(Post.class_id == class_id)
        .order_by(Post.created_at.desc())
        .all()
    )
    post_ids = [post.id for post in posts]

    comments_by_post: dict[int, list[Comment]] = {post_id: [] for post_id in post_ids}
    attachments_by_post: dict[int, list[Attachment]] = {post_id: [] for post_id in post_ids}
    
    if post_ids:
        all_comments = (
            db.query(Comment)
            .filter(Comment.post_id.in_(post_ids))
            .order_by(Comment.created_at.asc())
            .all()
        )
        for comment in all_comments:
            comments_by_post[comment.post_id].append(comment)

        all_attachments = (
            db.query(Attachment)
            .filter(Attachment.post_id.in_(post_ids))
            .all()
        )
        for att in all_attachments:
            attachments_by_post[att.post_id].append(att)

    return [_post_response(post, comments_by_post[post.id], attachments_by_post[post.id]) for post in posts]


@router.post(
    "/posts/{post_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    post_id: int,
    payload: CommentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = _get_post_or_404(db, post_id)
    class_ = _get_class_or_404(db, post.class_id)
    _ensure_can_view_class(db, class_, current_user)

    if payload.parent_id is not None:
        parent = (
            db.query(Comment)
            .filter(Comment.id == payload.parent_id, Comment.post_id == post_id)
            .first()
        )
        if not parent:
            raise BadRequestException("Parent comment does not belong to this post.")

    cleaned_content = sanitize_html(payload.content)
    comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        parent_id=payload.parent_id,
        content=cleaned_content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _comment_response(comment)
