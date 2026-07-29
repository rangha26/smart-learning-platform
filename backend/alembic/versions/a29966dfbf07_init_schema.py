"""init_schema

Revision ID: a29966dfbf07
Revises: 
Create Date: 2026-07-29 10:32:27.474595

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a29966dfbf07'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Define Enums
    user_role_enum = sa.Enum('ADMIN', 'INSTRUCTOR', 'STUDENT', name='user_role')
    user_status_enum = sa.Enum('ACTIVE', 'INACTIVE', name='user_status')
    class_status_enum = sa.Enum('ACTIVE', 'ARCHIVED', name='class_status')
    submission_state_enum = sa.Enum('ON_TIME', 'LATE', name='submission_state')

    # 2. Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role', user_role_enum, nullable=False, server_default='STUDENT'),
        sa.Column('status', user_status_enum, nullable=False, server_default='ACTIVE'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # 3. Create classes table
    op.create_table(
        'classes',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('subject', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('join_code', sa.String(length=20), nullable=False),
        sa.Column('instructor_id', sa.BigInteger(), nullable=False),
        sa.Column('status', class_status_enum, nullable=False, server_default='ACTIVE'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['instructor_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('join_code')
    )

    # 4. Create class_enrollments table
    op.create_table(
        'class_enrollments',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('class_id', sa.BigInteger(), nullable=False),
        sa.Column('student_id', sa.BigInteger(), nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('class_id', 'student_id', name='uq_class_student')
    )

    # 5. Create posts table
    op.create_table(
        'posts',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('class_id', sa.BigInteger(), nullable=False),
        sa.Column('author_id', sa.BigInteger(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 6. Create attachments table
    op.create_table(
        'attachments',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('post_id', sa.BigInteger(), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=True),
        sa.Column('file_type', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 7. Create comments table
    op.create_table(
        'comments',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('post_id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 8. Create assignments table
    op.create_table(
        'assignments',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('class_id', sa.BigInteger(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('max_score', sa.Numeric(precision=5, scale=2), nullable=False, server_default='10'),
        sa.Column('file_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 9. Create submissions table
    op.create_table(
        'submissions',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('assignment_id', sa.BigInteger(), nullable=False),
        sa.Column('student_id', sa.BigInteger(), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('status', submission_state_enum, nullable=False, server_default='ON_TIME'),
        sa.Column('grade', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['assignment_id'], ['assignments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('assignment_id', 'student_id', name='uq_assignment_student')
    )


def downgrade() -> None:
    op.drop_table('submissions')
    op.drop_table('assignments')
    op.drop_table('comments')
    op.drop_table('attachments')
    op.drop_table('posts')
    op.drop_table('class_enrollments')
    op.drop_table('classes')
    op.drop_table('users')

    sa.Enum(name='submission_state').drop(op.get_bind(), checkfirst=False)
    sa.Enum(name='class_status').drop(op.get_bind(), checkfirst=False)
    sa.Enum(name='user_status').drop(op.get_bind(), checkfirst=False)
    sa.Enum(name='user_role').drop(op.get_bind(), checkfirst=False)
