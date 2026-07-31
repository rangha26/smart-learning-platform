"""
Module APIRouter quản lý các API về Authentication (Xác thực người dùng)

Bao gồm các Endpoints:
- POST /api/v1/auth/register: Đăng ký tài khoản mới (Mã hóa mật khẩu BCrypt)
- POST /api/v1/auth/login: Đăng nhập nhận Access Token (30p) & Refresh Token (7 ngày)
- POST /api/v1/auth/refresh: Cấp lại Access Token mới từ Refresh Token
- POST /api/v1/auth/forgot-password: Sinh OTP bằng `secrets`, lưu Redis (TTL 10p) và gửi Email SMTP
- POST /api/v1/auth/verify-otp: Kiểm tra OTP (giới hạn 5 lần thử), xóa OTP, sinh reset_session_token
- POST /api/v1/auth/reset-password: Xác thực reset_session_token, đổi mật khẩu và xóa token
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core import (
    MAX_OTP_ATTEMPTS,
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
    create_access_token,
    create_refresh_token,
    decode_token,
    delete_otp,
    delete_reset_token,
    generate_otp_code,
    generate_reset_session_token,
    get_email_by_reset_token,
    get_otp,
    get_otp_attempts,
    get_password_hash,
    increment_otp_attempts,
    save_otp,
    save_reset_token,
    send_otp_email,
    settings,
    verify_password,
)
from app.db import get_db
from app.models import User, UserStatus
from app.schemas import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
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


# =========================================================================
# LUỒNG QUÊN VÀ ĐẶT LẠI MẬT KHẨU (FORGOT PASSWORD FLOW WITH OTP & REDIS)
# =========================================================================

@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Bước 1: Yêu cầu mã OTP quên mật khẩu",
    description="Sinh mã OTP ngẫu nhiên bằng `secrets`, lưu vào Redis (TTL 10 phút) và gửi qua SMTP Email."
)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # 1. Kiểm tra Email có tồn tại trên hệ thống không
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise NotFoundException(f"Không tìm thấy tài khoản tương ứng với email '{payload.email}'.")

    # 2. Sinh mã OTP 6 chữ số ngẫu nhiên an toàn bằng secrets module
    otp_code = generate_otp_code(digits=6)

    # 3. Lưu mã OTP vào Redis Cache với thời gian sống TTL = 10 phút (600 giây)
    ttl_seconds = settings.OTP_EXPIRE_MINUTES * 60
    save_otp(email=payload.email, otp_code=otp_code, ttl_seconds=ttl_seconds)

    # 4. Gửi Email thông báo chứa mã OTP qua SMTP Service
    send_otp_email(to_email=user.email, otp_code=otp_code, user_name=user.full_name)

    return MessageResponse(
        message=f"Mã OTP đã được gửi tới email '{payload.email}'. Mã có hiệu lực trong {settings.OTP_EXPIRE_MINUTES} phút."
    )


@router.post(
    "/verify-otp",
    response_model=VerifyOTPResponse,
    summary="Bước 2: Xác thực mã OTP (Giới hạn sai 5 lần)",
    description="Check OTP đúng + còn hạn TTL 10p + chưa vượt 5 lần thử sai. Đúng: Xóa OTP, sinh reset_session_token (UUID) lưu Redis (10p) và trả về cho Client."
)
def verify_otp(payload: VerifyOTPRequest):
    email = payload.email
    cached_otp = get_otp(email)

    # 1. Kiểm tra nếu đã vượt quá số lần thử sai
    attempts = get_otp_attempts(email)
    if attempts >= MAX_OTP_ATTEMPTS:
        delete_otp(email)
        raise BadRequestException(f"Bạn đã nhập sai mã OTP quá {MAX_OTP_ATTEMPTS} lần. Mã OTP đã bị hủy. Vui lòng yêu cầu mã mới.")

    # 2. Kiểm tra nếu OTP không tồn tại hoặc đã hết hạn
    if not cached_otp:
        raise BadRequestException("Mã OTP không tồn tại hoặc đã hết hạn (TTL 10 phút). Vui lòng yêu cầu mã mới.")

    # 3. Kiểm tra nếu mã OTP nhập sai
    if cached_otp != payload.otp_code:
        current_attempts = increment_otp_attempts(email)
        remaining = MAX_OTP_ATTEMPTS - current_attempts
        if remaining <= 0:
            delete_otp(email)
            raise BadRequestException(f"Bạn đã nhập sai mã OTP quá {MAX_OTP_ATTEMPTS} lần. Mã OTP đã bị hủy. Vui lòng yêu cầu mã mới.")
        else:
            raise BadRequestException(f"Mã OTP không chính xác. Bạn còn {remaining} lần thử.")

    # 4. XÁC THỰC THÀNH CÔNG: Xóa mã OTP, sinh reset_session_token (UUID) lưu Redis (TTL 10 phút)
    delete_otp(email)
    reset_session_token = generate_reset_session_token()
    ttl_seconds = settings.OTP_EXPIRE_MINUTES * 60
    save_reset_token(token=reset_session_token, email=email, ttl_seconds=ttl_seconds)

    return VerifyOTPResponse(
        reset_session_token=reset_session_token,
        message="Mã OTP hợp lệ. Vui lòng sử dụng reset_session_token để nhập mật khẩu mới."
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Bước 3: Đặt lại mật khẩu với reset_session_token",
    description="Xác thực reset_session_token từ Redis Cache, cập nhật mật khẩu mới bằng BCrypt và xóa token."
)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    # 1. Xác thực reset_session_token từ Redis Cache
    email = get_email_by_reset_token(payload.reset_session_token)
    if not email:
        raise BadRequestException("Phiên đặt lại mật khẩu (reset_session_token) không hợp lệ hoặc đã hết hạn (TTL 10 phút). Vui lòng thực hiện lại từ đầu.")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise NotFoundException("Tài khoản người dùng không tồn tại.")

    # 3. Cập nhật mật khẩu mới băm bằng BCrypt
    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()

    # 4. Xóa reset_session_token khỏi Redis Cache sau khi sử dụng thành công (Single-use token)
    delete_reset_token(payload.reset_session_token)

    return MessageResponse(message="Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.")
