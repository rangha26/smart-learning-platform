from app.schemas.auth import (
    AuthResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenPayload,
    TokenResponse,
    UserResponse,
)
from app.schemas.classes import (
    ClassCreateRequest,
    ClassJoinRequest,
    ClassResponse,
    UserSummaryResponse,
)

__all__ = [
    "RegisterRequest",
    "LoginRequest",
    "RefreshTokenRequest",
    "ChangePasswordRequest",
    "ForgotPasswordRequest",
    "ResetPasswordRequest",
    "UserResponse",
    "TokenResponse",
    "AuthResponse",
    "TokenPayload",
    "MessageResponse",
    "ClassCreateRequest",
    "ClassJoinRequest",
    "UserSummaryResponse",
    "ClassResponse",
]