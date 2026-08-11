from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.classes.router import _ensure_can_view_class, _get_class_or_404
from app.core import BadRequestException, ForbiddenException, NotFoundException
from app.db import get_db
from app.models import Class, Comment, Post, User, UserRole
from app.schemas import (
    CommentCreateRequest,
    CommentResponse,
    PostCreateRequest,
    PostResponse,
    UserSummaryResponse,
)

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


def _post_response(post: Post, comments: list[Comment]) -> PostResponse:
    return PostResponse(
        id=post.id,
        class_id=post.class_id,
        content=post.content,
        created_at=post.created_at,
        author=UserSummaryResponse.model_validate(post.author),
        author_role=post.author.role,
        comments=_build_comment_tree(comments),
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
def create_post(
    class_id: int,
    payload: PostCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    class_ = _get_class_or_404(db, class_id)
    _ensure_can_view_class(db, class_, current_user)
    _ensure_can_post(class_, current_user)

    post = Post(class_id=class_id, author_id=current_user.id, content=payload.content)
    db.add(post)
    db.commit()
    db.refresh(post)
    return _post_response(post, [])


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
    if post_ids:
        all_comments = (
            db.query(Comment)
            .filter(Comment.post_id.in_(post_ids))
            .order_by(Comment.created_at.asc())
            .all()
        )
        for comment in all_comments:
            comments_by_post[comment.post_id].append(comment)

    return [_post_response(post, comments_by_post[post.id]) for post in posts]


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

    comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        parent_id=payload.parent_id,
        content=payload.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _comment_response(comment)
