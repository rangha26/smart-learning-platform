"""
Module Quản lý Redis Cache & Mã OTP / Reset Token

Module này chịu trách nhiệm:
1. Sinh mã OTP ngẫu nhiên an toàn bằng thư viện cryptographically secure `secrets`.
2. Kết nối và lưu trữ mã OTP vào Redis Cache với TTL (10 phút / 600s).
3. Đếm và giới hạn số lần thử sai OTP (Tối đa 5 lần).
4. Sinh và quản lý `reset_session_token` (UUID) lưu trên Redis với TTL 10 phút sau khi OTP được xác thực đúng.
5. Hỗ trợ cơ chế Fallback tự động (In-Memory Dictionary Cache) nếu server Redis chưa bật.
"""

import logging
import secrets
import time
import uuid
from typing import Dict, Optional, Tuple
import redis

from app.core.config import settings

logger = logging.getLogger("app.redis")

MAX_OTP_ATTEMPTS = 5

# Khởi tạo Client Redis
redis_client: Optional[redis.Redis] = None

try:
    redis_client = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        password=settings.REDIS_PASSWORD or None,
        decode_responses=True,  # Trả về chuỗi str thay vì bytes
        socket_timeout=2,
    )
    # Kiểm tra kết nối
    redis_client.ping()
    logger.info(f"✅ Đã kết nối thành công tới Redis ({settings.REDIS_HOST}:{settings.REDIS_PORT})")
except Exception as err:
    logger.warning(f"⚠️ Không thể kết nối tới Redis ({err}). Chuyển sang chế độ In-Memory Cache cho OTP & Reset Token.")
    redis_client = None


# In-Memory Cache Fallback (Dành cho Dev/Local không bật Redis server)
_in_memory_store: Dict[str, Tuple[str, float]] = {}
_in_memory_attempts: Dict[str, int] = {}


def generate_otp_code(digits: int = 6) -> str:
    """Sinh mã OTP 6 chữ số ngẫu nhiên an toàn bằng thư viện secrets"""
    return "".join(secrets.choice("0123456789") for _ in range(digits))


def generate_reset_session_token() -> str:
    """Sinh chuỗi Token UUID ngẫu nhiên duy nhất đại diện cho phiên đặt lại mật khẩu"""
    return uuid.uuid4().hex


# ==========================================
# 1. QUẢN LÝ MÃ OTP VÀ SỐ LẦN THỬ SAI
# ==========================================

def save_otp(email: str, otp_code: str, ttl_seconds: int = 600) -> bool:
    """
    Lưu mã OTP vào Redis Cache với TTL (mặc định 10 phút = 600s).
    Đồng thời reset số lần thử sai về 0.
    """
    email_clean = email.lower()
    otp_key = f"otp:{email_clean}"
    attempts_key = f"otp_attempts:{email_clean}"

    try:
        if redis_client:
            redis_client.setex(otp_key, ttl_seconds, otp_code)
            redis_client.setex(attempts_key, ttl_seconds, "0")
            logger.info(f"🔑 Đã lưu OTP vào Redis cho [{email_clean}] (TTL: {ttl_seconds}s)")
            return True
    except Exception as e:
        logger.error(f"❌ Lỗi ghi OTP vào Redis: {e}. Chuyển sang In-Memory.")

    # Fallback In-Memory
    expire_at = time.time() + ttl_seconds
    _in_memory_store[otp_key] = (otp_code, expire_at)
    _in_memory_attempts[attempts_key] = 0
    return True


def get_otp(email: str) -> Optional[str]:
    """Lấy mã OTP từ Redis Cache hoặc In-Memory Store"""
    email_clean = email.lower()
    otp_key = f"otp:{email_clean}"

    try:
        if redis_client:
            val = redis_client.get(otp_key)
            if val:
                return str(val)
    except Exception as e:
        logger.error(f"❌ Lỗi đọc OTP từ Redis: {e}.")

    # Fallback In-Memory
    if otp_key in _in_memory_store:
        otp_code, expire_at = _in_memory_store[otp_key]
        if time.time() < expire_at:
            return otp_code
        else:
            del _in_memory_store[otp_key]

    return None


def increment_otp_attempts(email: str) -> int:
    """Tăng đếm số lần nhập sai mã OTP của Email và trả về số lần hiện tại"""
    email_clean = email.lower()
    attempts_key = f"otp_attempts:{email_clean}"

    try:
        if redis_client:
            attempts = redis_client.incr(attempts_key)
            return int(attempts)
    except Exception as e:
        logger.error(f"❌ Lỗi tăng attempts trên Redis: {e}")

    # Fallback In-Memory
    current = _in_memory_attempts.get(attempts_key, 0) + 1
    _in_memory_attempts[attempts_key] = current
    return current


def get_otp_attempts(email: str) -> int:
    """Lấy số lần đã thử nhập sai OTP"""
    email_clean = email.lower()
    attempts_key = f"otp_attempts:{email_clean}"

    try:
        if redis_client:
            val = redis_client.get(attempts_key)
            if val:
                return int(val)
    except Exception as e:
        logger.error(f"❌ Lỗi lấy attempts từ Redis: {e}")

    return _in_memory_attempts.get(attempts_key, 0)


def delete_otp(email: str) -> bool:
    """Xóa mã OTP và số lần thử khỏi Redis Cache"""
    email_clean = email.lower()
    otp_key = f"otp:{email_clean}"
    attempts_key = f"otp_attempts:{email_clean}"

    try:
        if redis_client:
            redis_client.delete(otp_key, attempts_key)
    except Exception as e:
        logger.error(f"❌ Lỗi xóa OTP trên Redis: {e}")

    if otp_key in _in_memory_store:
        del _in_memory_store[otp_key]
    if attempts_key in _in_memory_attempts:
        del _in_memory_attempts[attempts_key]

    return True


# ==========================================
# 2. QUẢN LÝ RESET SESSION TOKEN (SINGLE-USE)
# ==========================================

def save_reset_token(token: str, email: str, ttl_seconds: int = 600) -> bool:
    """Lưu Reset Session Token (UUID) ứng với Email vào Redis Cache với TTL 10 phút"""
    token_key = f"reset_token:{token}"
    try:
        if redis_client:
            redis_client.setex(token_key, ttl_seconds, email.lower())
            logger.info(f"🎫 Đã tạo reset session token cho [{email}] (TTL: {ttl_seconds}s)")
            return True
    except Exception as e:
        logger.error(f"❌ Lỗi ghi reset token vào Redis: {e}")

    # Fallback In-Memory
    expire_at = time.time() + ttl_seconds
    _in_memory_store[token_key] = (email.lower(), expire_at)
    return True


def get_email_by_reset_token(token: str) -> Optional[str]:
    """Lấy Email từ Reset Session Token"""
    token_key = f"reset_token:{token}"
    try:
        if redis_client:
            val = redis_client.get(token_key)
            if val:
                return str(val)
    except Exception as e:
        logger.error(f"❌ Lỗi đọc reset token từ Redis: {e}")

    # Fallback In-Memory
    if token_key in _in_memory_store:
        email, expire_at = _in_memory_store[token_key]
        if time.time() < expire_at:
            return email
        else:
            del _in_memory_store[token_key]

    return None


def delete_reset_token(token: str) -> bool:
    """Xóa Reset Session Token sau khi đặt lại mật khẩu thành công"""
    token_key = f"reset_token:{token}"
    try:
        if redis_client:
            redis_client.delete(token_key)
    except Exception as e:
        logger.error(f"❌ Lỗi xóa reset token trên Redis: {e}")

    if token_key in _in_memory_store:
        del _in_memory_store[token_key]

    return True
