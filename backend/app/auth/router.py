"""
Module APIRouter quản lý các API về Authentication (Xác thực người dùng)

Bao gồm các Endpoints:
- POST /api/v1/auth/register: Đăng ký tài khoản mới (Mã hóa mật khẩu BCrypt)
- POST /api/v1/auth/login: Đăng nhập nhận Access Token (30p) & Refresh Token (7 ngày)
- POST /api/v1/auth/refresh: Cấp lại Access Token mới từ Refresh Token
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core import (
    ConflictException,
    ForbiddenException,
    UnauthorizedException,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    settings,
    verify_password,
)
from app.db import get_db
from app.models import User, UserStatus
from app.schemas import (
    AuthResponse,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Đăng ký tài khoản mới",
    description="Kiểm tra email trùng lặp, băm mật khẩu bằng BCrypt và lưu thông tin User mới vào DB."
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # 1. Kiểm tra Email đã tồn tại trong DB chưa
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise ConflictException(f"Email '{payload.email}' đã được đăng ký trong hệ thống.")

    # 2. Băm mật khẩu bằng BCrypt
    hashed_pwd = get_password_hash(payload.password)

    # 3. Tạo User mới trong DB
    new_user = User(
        email=payload.email,
        hashed_password=hashed_pwd,
        full_name=payload.full_name,
        role=payload.role,
        status=UserStatus.ACTIVE,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4. Sinh Access Token (30 phút) & Refresh Token (7 ngày)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    access_token = create_access_token(
        subject=new_user.id,
        role=new_user.role,
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        subject=new_user.id,
        role=new_user.role,
        expires_delta=refresh_token_expires
    )

    return AuthResponse(
        user=UserResponse.model_validate(new_user),
        tokens=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=int(access_token_expires.total_seconds()),
        ),
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Đăng nhập tài khoản",
    description="Xác thực email & mật khẩu, trả về thông tin User kèm Access Token (30p) và Refresh Token (7 ngày)."
)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    # 1. Tìm User theo Email
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise UnauthorizedException("Email hoặc mật khẩu không chính xác.")

    # 2. Kiểm tra trạng thái tài khoản
    if user.status != UserStatus.ACTIVE:
        raise ForbiddenException("Tài khoản của bạn đang bị khóa hoặc chưa kích hoạt.")

    # 3. Sinh Access Token (30 phút) & Refresh Token (7 ngày)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    access_token = create_access_token(
        subject=user.id,
        role=user.role,
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        subject=user.id,
        role=user.role,
        expires_delta=refresh_token_expires
    )

    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=int(access_token_expires.total_seconds()),
        ),
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Cấp Access Token mới",
    description="Xác thực Refresh Token hợp lệ và trả về Access Token mới (sống 30p)."
)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    # 1. Giải mã và xác thực Refresh Token
    token_data = decode_token(payload.refresh_token)

    # 2. Kiểm tra loại Token phải là refresh
    if token_data.get("type") != "refresh":
        raise UnauthorizedException("Token không hợp lệ. Vui lòng truyền vào Refresh Token.")

    # 3. Lấy User ID từ Token subject (sub)
    user_id_str = token_data.get("sub")
    if not user_id_str:
        raise UnauthorizedException("Mã người dùng không hợp lệ trong Token.")

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise UnauthorizedException("User ID trong Token không đúng định dạng.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UnauthorizedException("Tài khoản người dùng không tồn tại.")

    if user.status != UserStatus.ACTIVE:
        raise ForbiddenException("Tài khoản của bạn đã bị khóa.")

    # 4. Sinh Access Token mới (30 phút)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        subject=user.id,
        role=user.role,
        expires_delta=access_token_expires
    )

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=payload.refresh_token,
        token_type="bearer",
        expires_in=int(access_token_expires.total_seconds()),
    )
