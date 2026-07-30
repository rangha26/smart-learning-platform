"""
Module Cấu hình Ứng dụng (App Configuration Module)

Module này chịu trách nhiệm:
1. Đọc và nạp các biến môi trường (Environment Variables) từ file .env thông qua python-dotenv.
2. Ép kiểu (type-casting) và xác thực (validation) cấu hình bằng Pydantic BaseSettings.
3. Tự động parse danh sách domain CORS (CORS_ORIGINS) dạng chuỗi JSON hoặc danh sách phân cách bằng dấu phẩy.
4. Cung cấp đối tượng singleton `settings` dùng chung cho toàn bộ hệ thống Backend.
"""

import json
from typing import List, Union
from dotenv import load_dotenv
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load biến môi trường từ file .env vào os.environ
load_dotenv()


class Settings(BaseSettings):
    """Cấu hình toàn bộ ứng dụng đọc từ file .env và Environment Variables"""

    # App General Configs
    APP_NAME: str = "Smart Learning Platform API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database Configs
    DATABASE_URL: str = "postgresql+psycopg2://app_user:app_password@localhost:5432/classroom_db"

    # CORS Origins Config
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # JWT Auth Configs
    SECRET_KEY: str = "super-secret-key-change-this-in-production-smart-learning-platform-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Tự động chuyển đổi chuỗi từ .env thành List[str]"""
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            if v.startswith("[") and v.endswith("]"):
                return json.loads(v)
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return v
        raise ValueError(f"Không thể parse CORS_ORIGINS từ giá trị: {v}")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
