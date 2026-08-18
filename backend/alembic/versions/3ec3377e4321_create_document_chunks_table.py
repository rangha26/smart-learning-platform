"""create document_chunks table

Revision ID: 3ec3377e4321
Revises: c1a2b3d4e5f6
Create Date: 2026-08-15 15:52:42.471414

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
import pgvector.sqlalchemy
# revision identifiers, used by Alembic.
revision: str = '3ec3377e4321'
down_revision: Union[str, Sequence[str], None] = 'c1a2b3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Bật extension pgvector trước khi tạo bảng
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')
    
    op.create_table(
        'document_chunks',
        sa.Column('id', sa.BigInteger().with_variant(sa.Integer(), 'sqlite'), autoincrement=True, nullable=False),
        sa.Column('class_id', sa.BigInteger(), nullable=False),
        sa.Column('source_type', sa.String(length=50), nullable=False),
        sa.Column('source_id', sa.BigInteger(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('embedding', pgvector.sqlalchemy.Vector(768), nullable=False),
        sa.Column('metadata_json', JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('document_chunks')
    # Không tự động DROP EXTENSION vector vì có thể ảnh hưởng database khác
