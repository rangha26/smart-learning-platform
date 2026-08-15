"""widen attachments.file_type to fit long MIME types

Revision ID: c1a2b3d4e5f6
Revises: 8fa3afb1dcd2
Create Date: 2026-08-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c1a2b3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "8fa3afb1dcd2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "attachments",
        "file_type",
        existing_type=sa.String(length=50),
        type_=sa.String(length=150),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "attachments",
        "file_type",
        existing_type=sa.String(length=150),
        type_=sa.String(length=50),
        existing_nullable=True,
    )
