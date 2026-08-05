from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db  
from app.models.all_models import User, PasswordResetToken
from app.schemas.user import UserCreate, UserResponse
from app.schemas.response import ResponseSchema
from app.core.config import settings
from app.core.security import hash_password
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, ForgotPasswordRequest, ResetPasswordConfirm, TokenRefreshRequest
from app.core.security import verify_password, create_access_token, create_refresh_token
from jose import JWTError, jwt
import secrets
from datetime import datetime, timedelta
from app.api.deps import get_current_user


router = APIRouter()

@router.post("/register", response_model=ResponseSchema[UserResponse])
def register(user_in: UserCreate, db: Session = Depends(get_db)):

    user_exists = db.query(User).filter(User.email == user_in.email).first()
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    new_user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        status="ACTIVE"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "success": True,
        "message": "User registered successfully",
        "data": new_user
    }

@router.post("/login", response_model=ResponseSchema[TokenResponse])
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token_data = {"sub": user.email, "role": user.role, "user_id": user.id}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user
        }
    }

@router.post("/refresh", response_model=ResponseSchema[dict])
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        decoded_data = jwt.decode(payload.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        if decoded_data.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        email = decoded_data.get("sub")
        user = db.query(User).filter(User.email == email).first()
        
        if not user or user.status != "ACTIVE":
            raise HTTPException(status_code=401, detail="User not found")

        new_access_token = create_access_token(
            data={"sub": user.email, "role": user.role, "user_id": str(user.id)}
        )

        return {
            "success": True,
            "message": "Token refreshed",
            "data": {"access_token": new_access_token}
        }

    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh token expired or invalid")

@router.post("/forgot-password", response_model=ResponseSchema[dict])
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        return {
            "success": True,
            "message": "If the email exists, a password reset token has been sent."
        }

    reset_token = secrets.token_hex(3).upper()

    new_reset = PasswordResetToken(
        email=user.email,
        token=reset_token,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(new_reset)
    db.commit()

    print(f"Password reset token for {user.email}: {reset_token} (expires in 10 minutes)")

    return {
        "success": True,
        "message": "Reset code sent to your email (check console/logs).",
    }

@router.post("/reset-password", response_model=ResponseSchema[dict])
def reset_password(data: ResetPasswordConfirm, db: Session = Depends(get_db)):
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == data.token,
        PasswordResetToken.is_used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(User).filter(User.email == reset_token.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(data.new_password)
    reset_token.is_used = True

    db.commit()

    return {
        "success": True,
        "message": "Password has been reset successfully."
    }

@router.get("/me", response_model=ResponseSchema[UserResponse])
def get_user_profile(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "message": "User profile retrieved successfully.",
        "data": current_user
    }

@router.post("/logout", response_model=ResponseSchema[dict])
def logout(current_user: User = Depends(get_current_user)):
    # In a real-world scenario, you might want to invalidate the user's tokens here
    return {
        "success": True,
        "message": "Logged out successfully.",
        "data": None
    }

@router.post("/reset-password-confirm")
def reset_password_after_otp(data: ResetPasswordConfirm, db: Session = Depends(get_db)):
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == data.token,
        PasswordResetToken.is_used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(User).filter(User.email == reset_token.email).first()
    user.hashed_password = hash_password(data.new_password)

    reset_token.is_used = True
    db.commit()

    return {
        "success": True,
        "message": "Password has been reset successfully."
    }
