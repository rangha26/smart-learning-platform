from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core import ForbiddenException, UnauthorizedException, decode_token
from app.db import get_db
from app.models import User, UserRole, UserStatus


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization:
        raise UnauthorizedException("Missing Authorization header.")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise UnauthorizedException("Authorization header must use Bearer token.")

    payload = decode_token(token)
    if payload.get("type") != "access":
        raise UnauthorizedException("Access token is required.")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Token does not contain a valid user id.")

    try:
        parsed_user_id = int(user_id)
    except ValueError:
        raise UnauthorizedException("Token user id is invalid.")

    user = db.query(User).filter(User.id == parsed_user_id).first()
    if not user:
        raise UnauthorizedException("User does not exist.")

    if user.status != UserStatus.ACTIVE:
        raise ForbiddenException("Your account is inactive.")

    return user


def require_roles(*roles: UserRole):
    allowed_roles: set[UserRole] = set(roles)

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            names = ", ".join(role.value for role in allowed_roles)
            raise ForbiddenException(f"This action requires one of these roles: {names}.")
        return current_user

    return dependency
