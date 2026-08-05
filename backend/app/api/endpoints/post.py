from fastapi import Depends, HTTPException, APIRouter
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.api.deps import get_instructor, check_class_membership, get_db, get_current_user
from app.db.session import get_db
from app.models.all_models import Comment, Post, Class, User, ClassEnrollment, Attachment
from app.schemas.post import PostCreate, PostResponse, CommentCreate, CommentResponse, PostDetailResponse
from app.schemas.response import ResponseSchema
from typing import List

router = APIRouter()

@router.post("/{class_id}/posts", response_model=ResponseSchema[PostResponse])
def create_post(class_id: int, post: PostCreate, current_user: User = Depends(get_instructor), db: Session = Depends(get_db)):
    """Create a new post in a class."""
    classroom = db.query(Class).filter(Class.id == class_id, Class.instructor_id == current_user.id).first()
    if not classroom:
        raise HTTPException(status_code=403, detail="You are not the instructor of this class.")

    new_post = Post(class_id=class_id, author_id=current_user.id, content=post.content, post_type='announcement')
    db.add(new_post)
    db.flush()  

    if post.attachment_ids:
        db.query(Attachment).filter(Attachment.id.in_(post.attachment_ids)).update({"post_id": new_post.id}, synchronize_session=False)
    db.commit()
    db.refresh(new_post)

    new_post.comment_count = 0

    return {
        "success": True,
        "message": "Post created successfully",
        "data": new_post
    }

@router.get("/{class_id}/posts", response_model=ResponseSchema[List[PostResponse]])
def get_class_posts(class_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all posts for a class."""
    check_class_membership(class_id, current_user, db)  
    posts = db.query(Post).filter(Post.class_id == class_id).order_by(Post.created_at.desc()).all()

    for post in posts:
        post.comment_count = db.query(func.count(Comment.id)).filter(Comment.post_id == post.id).scalar()

    return {
        "success": True,
        "message": "Posts retrieved successfully",
        "data": posts
    }

@router.post("/posts/{post_id}/comments", response_model=ResponseSchema[CommentResponse])
def create_comment(post_id: int, comment: CommentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new comment on a post."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    check_class_membership(post.class_id, current_user, db)

    new_comment = Comment(post_id=post_id, user_id=current_user.id, content=comment.content)
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return {
        "success": True,
        "message": "Comment created successfully",
        "data": new_comment
    }

@router.get("/posts/{post_id}/comments", response_model=ResponseSchema[List[CommentResponse]])
def get_post_comments(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all comments for a post."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    check_class_membership(post.class_id, current_user, db)

    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.desc()).all()

    return {
        "success": True,
        "message": "Comments retrieved successfully",
        "data": comments
    }

@router.get("/posts/{post_id}", response_model=ResponseSchema[PostDetailResponse])
def get_post_details(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the details for a post."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    check_class_membership(post.class_id, current_user, db)

    comments = db.query(Comment).filter(Comment.post_id == post_id).all()

    post.comment_count = len(comments)

    return {
        "success": True,
        "message": "Details retrieved successfully",
        "data": {"post": post, "comments": post.comments, "comment_count": len(comments)}
    }