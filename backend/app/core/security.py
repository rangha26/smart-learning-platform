"""
Module Bảo mật & Xác thực (Security & Authentication Module)

Module này cung cấp các tiện ích bảo mật cốt lõi:
1. Băm mật khẩu (Password Hashing) và xác thực mật khẩu (Password Verification) bằng thuật toán bcrypt.
2. Tạo JWT Access Token (`create_access_token`) và JWT Refresh Token (`create_refresh_token`).
3. Giải mã và kiểm tra tính hợp lệ của JWT Token (`decode_token`).
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import bcrypt
from jose import JWTError, jwt

from app.core.config import settings
from app.core.exceptions import UnauthorizedException


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
    """Tạo JWT Access Token"""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    role_str = role.value if hasattr(role, "value") else str(role)

    to_encode = {
        "sub": str(subject),
        "role": role_str,
        "type": "access",
        "exp": expire,
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: Any, role: Any, expires_delta: Optional[timedelta] = None) -> str:
    """Tạo JWT Refresh Token"""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    role_str = role.value if hasattr(role, "value") else str(role)

    to_encode = {
        "sub": str(subject),
        "role": role_str,
        "type": "refresh",
        "exp": expire,
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """Giải mã và kiểm tra tính hợp lệ của JWT Token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise UnauthorizedException("Token không hợp lệ hoặc đã hết hạn.")
