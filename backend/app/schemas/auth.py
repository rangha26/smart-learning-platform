from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import UserRole, UserStatus


# ==========================================
# 1. REQUEST SCHEMAS (Dữ liệu gửi lên từ Client)
# ==========================================

class RegisterRequest(BaseModel):
    """Schema cho API Đăng ký tài khoản mới (/auth/register)"""
    email: EmailStr = Field(..., description="Email người dùng", example="student@example.com")
    password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="Mật khẩu (tối thiểu 8 ký tự)",
        example="SecurePassword123!"
    )
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Họ và tên người dùng",
        example="Nguyen Van A"
    )
    role: UserRole = Field(
        default=UserRole.STUDENT,
        description="Vai trò người dùng (STUDENT hoặc INSTRUCTOR)",
        example=UserRole.STUDENT
    )


class LoginRequest(BaseModel):
    """Schema cho API Đăng nhập bằng Email & Password (/auth/login)"""
    email: EmailStr = Field(..., description="Email đăng nhập", example="student@example.com")
    password: str = Field(..., description="Mật khẩu", example="SecurePassword123!")


class RefreshTokenRequest(BaseModel):
    """Schema cho API Làm mới Access Token (/auth/refresh)"""
    refresh_token: str = Field(..., description="Refresh token hợp lệ", example="eyJhbGciOiJIUzI1NiIsIn...")


class ChangePasswordRequest(BaseModel):
    """Schema cho API Đổi mật khẩu (/auth/change-password)"""
    old_password: str = Field(..., description="Mật khẩu hiện tại", example="OldPassword123!")
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="Mật khẩu mới (tối thiểu 8 ký tự)",
        example="NewSecurePassword123!"
    )


class ForgotPasswordRequest(BaseModel):
    """Schema cho API Yêu cầu quên mật khẩu (/auth/forgot-password)"""
    email: EmailStr = Field(..., description="Email nhận link reset mật khẩu", example="student@example.com")


class ResetPasswordRequest(BaseModel):
    """Schema cho API Đặt lại mật khẩu với token (/auth/reset-password)"""
    token: str = Field(..., description="Reset token gửi qua email")
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="Mật khẩu mới",
        example="NewSecurePassword123!"
    )


# ==========================================
# 2. RESPONSE SCHEMAS (Dữ liệu trả về cho Client)
# ==========================================

class UserResponse(BaseModel):
    """Schema thông tin chi tiết User trả về cho Client"""
    id: int = Field(..., description="ID duy nhất của user")
    email: EmailStr = Field(..., description="Email người dùng")
    full_name: str = Field(..., description="Họ và tên")
    role: UserRole = Field(..., description="Vai trò (ADMIN, INSTRUCTOR, STUDENT)")
    status: UserStatus = Field(..., description="Trạng thái tài khoản (ACTIVE, INACTIVE)")
    created_at: datetime = Field(..., description="Thời gian tạo tài khoản")
    updated_at: datetime = Field(..., description="Thời gian cập nhật gần nhất")

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """Schema trả về Access Token & Refresh Token"""
    access_token: str = Field(..., description="JWT Access Token dùng để xác thực các request tiếp theo")
    refresh_token: str = Field(..., description="JWT Refresh Token dùng để lấy Access Token mới")
    token_type: str = Field(default="bearer", description="Loại token (mặc định là bearer)")
    expires_in: int = Field(..., description="Thời gian hết hạn của access_token tính theo giây", example=3600)


class AuthResponse(BaseModel):
    """Schema trả về đầy đủ thông tin User + Tokens sau khi Register/Login thành công"""
    user: UserResponse
    tokens: TokenResponse


class TokenPayload(BaseModel):
    """Schema cấu trúc Payload bên trong JWT Token"""
    sub: str = Field(..., description="Subject của token (thường là User ID)")
    role: UserRole = Field(..., description="Vai trò của user")
    exp: Optional[int] = Field(default=None, description="Expiration UNIX timestamp")


class MessageResponse(BaseModel):
    """Schema chung cho phản hồi thông báo thành công (Logout, Forgot Password, Reset Password,...)"""
    message: str = Field(..., description="Thông báo phản hồi", example="Thao tác thành công.")
    success: bool = Field(default=True, description="Trạng thái thao tác")
