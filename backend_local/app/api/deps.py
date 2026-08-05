from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.all_models import User, Class, ClassEnrollment


security = HTTPBearer()

def get_current_user(db: Session = Depends(get_db), auth: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get the current user based on the JWT token."""
    token = auth.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception

    if user.status == "INACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    
    return user

def get_instructor(current_user: User = Depends(get_current_user)):
    """Get the current user and ensure they are an instructor."""
    if current_user.role != "INSTRUCTOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have instructor privileges",
        )
    return current_user

def get_student(current_user: User = Depends(get_current_user)):
    """Get the current user and ensure they are a student."""
    if current_user.role != "STUDENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have student privileges",
        )
    return current_user

def get_admin(current_user: User = Depends(get_current_user)):
    """Get the current user and ensure they are an admin."""
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have admin privileges",
        )
    return current_user

def check_class_membership(class_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Check if the current user is a member of the specified class."""
    enrollment = db.query(Class).filter(
        Class.id == class_id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=404,
            detail="Class not found",
        )

    if enrollment.instructor_id == current_user.id:
        return current_user  

    membership = db.query(ClassEnrollment).filter(
        ClassEnrollment.class_id == class_id,
        ClassEnrollment.student_id == current_user.id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=403,
            detail="User is not a member of this class",
        )
    return current_user