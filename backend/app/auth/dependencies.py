from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core import ForbiddenException, UnauthorizedException, decode_token
from app.db import get_db
from app.models import User, UserRole, UserStatus


from app.core.security import get_current_user


def require_roles(*roles: UserRole):
    allowed_roles: set[UserRole] = set(roles)

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            names = ", ".join(role.value for role in allowed_roles)
            raise ForbiddenException(f"This action requires one of these roles: {names}.")
        return current_user

    return dependency
