"""
Module Quản lý Redis Cache & Mã OTP / Reset Token

Module này chịu trách nhiệm:
1. Sinh mã OTP ngẫu nhiên an toàn bằng thư viện cryptographically secure `secrets`.
2. Kết nối và lưu trữ mã OTP vào Redis Cache với TTL (10 phút / 600s).
3. Đếm và giới hạn số lần thử sai OTP (Tối đa 5 lần).
4. Sinh và quản lý `reset_session_token` (UUID) lưu trên Redis với TTL 10 phút sau khi OTP được xác thực đúng.
5. Hỗ trợ cơ chế Fallback tự động (In-Memory Dictionary Cache) nếu server Redis chưa bật.
"""

import hashlib
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


def _hash_email(email: str) -> str:
    """
    Hash email thành chuỗi SHA-256 hex trước khi dùng làm Redis key.

    Tỷ lệ giảm PII: email plaintext không bị lộ qua Redis dump, Redis UI,
    Docker logs hoặc hệ thống monitoring.
    """
    return hashlib.sha256(email.lower().encode("utf-8")).hexdigest()


# Lua script: atomic INCR + EXPIRE (chỉ đặt EXPIRE khi key được tạo lần đầu - value == 1)
# Giải quyết race condition: INCR và EXPIRE không thể bị ngắt giữa chừng bởi request khác.
# KEYS[1] = attempts_key, ARGV[1] = ttl_seconds
_INCR_WITH_EXPIRE_LUA = """
local val = redis.call('INCR', KEYS[1])
if val == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return val
"""


# ==========================================
# 1. QUẢN LÝ MÃ OTP VÀ SỐ LẦN THỊ SAI
# ==========================================

def save_otp(email: str, otp_code: str, ttl_seconds: int = 600) -> bool:
    """
    Lưu mã OTP vào Redis Cache với TTL (mặc định 10 phút = 600s).
    Đồng thời reset số lần thử sai về 0.

    Email được hash SHA-256 trước khi tạo key để tránh rò rỉ PII.
    """
    email_hash = _hash_email(email)
    otp_key = f"otp:{email_hash}"
    attempts_key = f"otp_attempts:{email_hash}"

    try:
        if redis_client:
            redis_client.setex(otp_key, ttl_seconds, otp_code)
            redis_client.setex(attempts_key, ttl_seconds, "0")
            logger.info(f"🔑 Đã lưu OTP vào Redis (TTL: {ttl_seconds}s)")
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
    email_hash = _hash_email(email)
    otp_key = f"otp:{email_hash}"

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


def increment_otp_attempts(email: str, ttl_seconds: int = 600) -> int:
    """
    Tăng đếm số lần nhập sai mã OTP của Email và trả về số lần hiện tại.

    Sử dụng Lua script atomic để INCR + đặt EXPIRE đồng thời, tránh race condition
    khi nhiều request verify-otp xảy ra cùng lúc. TTL của attempts luôn khớp với TTL OTP.

    Args:
        email: Email người dùng.
        ttl_seconds: TTL của attempts key, phải bằng TTL OTP (mặc định 600s).
    """
    email_hash = _hash_email(email)
    attempts_key = f"otp_attempts:{email_hash}"

    try:
        if redis_client:
            # Lua script: INCR và EXPIRE cùng trong một thao tác atomic
            result = redis_client.eval(_INCR_WITH_EXPIRE_LUA, 1, attempts_key, ttl_seconds)
            return int(result)
    except Exception as e:
        logger.error(f"❌ Lỗi tăng attempts trên Redis: {e}")

    # Fallback In-Memory
    current = _in_memory_attempts.get(attempts_key, 0) + 1
    _in_memory_attempts[attempts_key] = current
    return current


def get_otp_attempts(email: str) -> int:
    """Lấy số lần đã thử nhập sai OTP"""
    email_hash = _hash_email(email)
    attempts_key = f"otp_attempts:{email_hash}"

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
    email_hash = _hash_email(email)
    otp_key = f"otp:{email_hash}"
    attempts_key = f"otp_attempts:{email_hash}"

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


# ==========================================
# 3. TOKEN WHITELIST (JTI-based Revocation)
# ==========================================
# Cơ chế:
#   - Mỗi token JWT được gắn một JTI (JWT ID) duy nhất khi phát hành.
#   - JTI được lưu vào Redis với TTL bằng thời gian sống của token:
#       * key `token_jti:{jti}` → user_id (để xác minh nhanh)
#       * key `user_tokens:{user_id}` → Redis Set chứa tất cả JTI đang active
#   - Khi xác thực request: kiểm tra `token_jti:{jti}` có tồn tại không.
#   - Khi thu hồi (logout-all / đổi mật khẩu):
#       * Lấy toàn bộ JTI từ `user_tokens:{user_id}`, xóa từng `token_jti:{jti}`.
#       * Xóa luôn `user_tokens:{user_id}`.

# In-Memory fallback cho token whitelist
_token_whitelist: dict[str, str] = {}          # jti -> user_id
_user_token_index: dict[str, set] = {}         # user_id -> set of jti


def store_token(jti: str, user_id: int, ttl_seconds: int) -> bool:
    """
    Lưu JTI của token vào Redis whitelist khi phát hành token mới.

    Args:
        jti: JWT ID duy nhất của token.
        user_id: ID người dùng sở hữu token.
        ttl_seconds: Thời gian sống của token (giây), khớp với `exp` trong JWT.
    """
    jti_key = f"token_jti:{jti}"
    user_set_key = f"user_tokens:{user_id}"
    uid_str = str(user_id)

    try:
        if redis_client:
            pipe = redis_client.pipeline()
            # Lưu JTI → user_id với TTL bằng thời gian sống token
            pipe.setex(jti_key, ttl_seconds, uid_str)
            # Thêm JTI vào tập hợp của user; set TTL dài hơn để tập không bị xóa trước token
            pipe.sadd(user_set_key, jti)
            pipe.expire(user_set_key, ttl_seconds + 60)
            pipe.execute()
            logger.debug(f"🎟️ Đã lưu JTI [{jti[:8]}...] cho user [{user_id}] (TTL: {ttl_seconds}s)")
            return True
    except Exception as e:
        logger.error(f"❌ Lỗi lưu token JTI vào Redis: {e}. Chuyển sang In-Memory.")

    # Fallback In-Memory
    _token_whitelist[jti_key] = uid_str
    if uid_str not in _user_token_index:
        _user_token_index[uid_str] = set()
    _user_token_index[uid_str].add(jti)
    return True


def is_token_valid(jti: str) -> bool:
    """
    Kiểm tra token có còn hiệu lực trong whitelist không.

    Returns:
        True nếu JTI tồn tại trong Redis (token chưa bị thu hồi và chưa hết hạn).
        False nếu JTI không tồn tại (đã bị xóa bởi logout-all / đổi mật khẩu, hoặc hết TTL).
    """
    jti_key = f"token_jti:{jti}"

    try:
        if redis_client:
            return bool(redis_client.exists(jti_key))
    except Exception as e:
        logger.error(f"❌ Lỗi kiểm tra JTI trên Redis: {e}. Dùng In-Memory fallback.")

    # Fallback In-Memory
    return jti_key in _token_whitelist


def revoke_all_user_tokens(user_id: int) -> int:
    """
    Thu hồi tất cả token đang active của một user (logout-all / đổi mật khẩu).

    Xóa toàn bộ `token_jti:{jti}` thuộc user và xóa tập `user_tokens:{user_id}`.

    Returns:
        Số lượng JTI đã bị thu hồi.
    """
    uid_str = str(user_id)
    user_set_key = f"user_tokens:{user_id}"
    revoked_count = 0

    try:
        if redis_client:
            # Lấy tất cả JTI thuộc user
            jtis = redis_client.smembers(user_set_key)
            if jtis:
                # Xóa từng token_jti key
                jti_keys = [f"token_jti:{jti}" for jti in jtis]
                pipe = redis_client.pipeline()
                for k in jti_keys:
                    pipe.delete(k)
                pipe.delete(user_set_key)
                pipe.execute()
                revoked_count = len(jtis)
            else:
                redis_client.delete(user_set_key)

            logger.info(f"🚫 Đã thu hồi {revoked_count} token(s) của user [{user_id}]")
            return revoked_count
    except Exception as e:
        logger.error(f"❌ Lỗi thu hồi token trên Redis: {e}. Dùng In-Memory fallback.")

    # Fallback In-Memory
    jtis_local = _user_token_index.pop(uid_str, set())
    for jti in jtis_local:
        _token_whitelist.pop(f"token_jti:{jti}", None)
    revoked_count = len(jtis_local)
    logger.info(f"🚫 [In-Memory] Đã thu hồi {revoked_count} token(s) của user [{user_id}]")
    return revoked_count
