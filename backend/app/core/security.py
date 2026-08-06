"""
Module Bảo mật & Xác thực (Security & Authentication Module)

Module này cung cấp các tiện ích bảo mật cốt lõi:
1. Băm mật khẩu (Password Hashing) và xác thực mật khẩu (Password Verification) bằng thuật toán bcrypt.
2. Tạo JWT Access Token (`create_access_token`) và JWT Refresh Token (`create_refresh_token`).
3. Giải mã và kiểm tra tính hợp lệ của JWT Token (`decode_token`).
4. Dependency `get_current_user` xác thực người dùng từ Bearer Token, bao gồm kiểm tra JTI trong Redis whitelist.

Cơ chế thu hồi JWT Token (JTI-based Whitelist):
- Mỗi token được gắn JTI (JWT ID) duy nhất khi phát hành.
- JTI được lưu vào Redis với TTL = thời gian sống của token.
- Khi xác thực: kiểm tra JTI có tồn tại trong Redis không.
- Khi thu hồi (logout-all / đổi mật khẩu): xóa tất cả JTI của user khỏi Redis.
  Token đã bị xóa JTI sẽ không qua được bước kiểm tra whitelist.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import bcrypt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.db import get_db
from app.models import User, UserStatus

security_bearer = HTTPBearer(auto_error=False)


# ==========================================
# 1. BĂM VÀ XÁC THỰC MẬT KHẨU (BCRYPT)
# ==========================================

def get_password_hash(password: str) -> str:
    """Tạo chuỗi bcrypt hash từ mật khẩu thô (Cắt tối đa 72 bytes chuẩn bcrypt)"""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Xác thực mật khẩu thô khớp với chuỗi bcrypt hash"""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except (ValueError, TypeError):
        return False


# ==========================================
# 2. TẠO VÀ XÁC THỰC JWT TOKEN
# ==========================================

def create_access_token(subject: Any, role: Any, expires_delta: Optional[timedelta] = None) -> str:
    """
    Tạo JWT Access Token với JTI (JWT ID) duy nhất.

    JTI được nhúng vào payload để có thể kiểm tra và thu hồi token qua Redis whitelist.
    Caller phải gọi `store_token(jti, user_id, ttl)` sau khi tạo token để đăng ký vào whitelist.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    role_str = role.value if hasattr(role, "value") else str(role)
    jti = uuid.uuid4().hex  # JWT ID duy nhất cho mỗi token

    to_encode = {
        "sub": str(subject),
        "role": role_str,
        "type": "access",
        "jti": jti,
        "exp": expire,
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: Any, role: Any, expires_delta: Optional[timedelta] = None) -> str:
    """
    Tạo JWT Refresh Token với JTI (JWT ID) duy nhất.

    JTI được nhúng vào payload để có thể kiểm tra và thu hồi token qua Redis whitelist.
    Caller phải gọi `store_token(jti, user_id, ttl)` sau khi tạo token để đăng ký vào whitelist.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    role_str = role.value if hasattr(role, "value") else str(role)
    jti = uuid.uuid4().hex  # JWT ID duy nhất cho mỗi token

    to_encode = {
        "sub": str(subject),
        "role": role_str,
        "type": "refresh",
        "jti": jti,
        "exp": expire,
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """Giải mã và kiểm tra tính hợp lệ của JWT Token (chữ ký + thời gian hết hạn)"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise UnauthorizedException("Token không hợp lệ hoặc đã hết hạn.")


# ==========================================
# 3. FASTAPI AUTHENTICATION DEPENDENCY
# ==========================================

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency xác thực người dùng hiện tại từ Bearer Access Token.

    Quy trình kiểm tra:
    1. Giải mã JWT (chữ ký + exp).
    2. Kiểm tra loại token là `access`.
    3. Truy vấn user từ DB và kiểm tra trạng thái tài khoản.
    4. Kiểm tra JTI trong Redis whitelist — token đã bị thu hồi (do logout-all
       hoặc đổi mật khẩu) sẽ không tìm thấy JTI và bị từ chối.
    """
    # Import ở đây để tránh circular import
    from app.core.redis import is_token_valid

    if not credentials or not credentials.credentials or credentials.scheme.lower() != "bearer":
        raise UnauthorizedException("Vui lòng cung cấp Authorization Bearer Token.")

    token = credentials.credentials

    # 1. Giải mã Token (chữ ký + exp)
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise UnauthorizedException("Loại Token không hợp lệ cho thao tác này (Cần Access Token).")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedException("Mã người dùng không hợp lệ trong Token.")

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise UnauthorizedException("User ID trong Token không đúng định dạng.")

    # 2. Tìm User trong DB
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UnauthorizedException("Tài khoản người dùng không tồn tại.")

    if user.status != UserStatus.ACTIVE:
        raise UnauthorizedException("Tài khoản của bạn đã bị khóa.")

    # 3. Kiểm tra JTI trong Redis whitelist — phát hiện token đã bị thu hồi
    jti = payload.get("jti")
    if not jti:
        raise UnauthorizedException("Token không hợp lệ (thiếu JWT ID).")

    if not is_token_valid(jti):
        raise UnauthorizedException(
            "Token đã bị thu hồi. Vui lòng đăng nhập lại."
        )

    return user
