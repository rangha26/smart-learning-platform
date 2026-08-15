import enum
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from pgvector.sqlalchemy import Vector

from app.db import Base


# ---------------------------------------------------------------------
# Enums (map sang PostgreSQL ENUM type)
# ---------------------------------------------------------------------
class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    INSTRUCTOR = "INSTRUCTOR"
    STUDENT = "STUDENT"


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class ClassStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"


class SubmissionState(str, enum.Enum):
    ON_TIME = "ON_TIME"
    LATE = "LATE"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=False, default=UserRole.STUDENT
    )
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status"), nullable=False, default=UserStatus.ACTIVE
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    classes_taught: Mapped[list["Class"]] = relationship(back_populates="instructor")
    enrollments: Mapped[list["ClassEnrollment"]] = relationship(back_populates="student")
    submissions: Mapped[list["Submission"]] = relationship(back_populates="student")


# ---------------------------------------------------------------------
# 2. classes
# ---------------------------------------------------------------------
class Class(Base):
    __tablename__ = "classes"

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str | None] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
    join_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    instructor_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    status: Mapped[ClassStatus] = mapped_column(
        Enum(ClassStatus, name="class_status"), nullable=False, default=ClassStatus.ACTIVE
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    instructor: Mapped["User"] = relationship(back_populates="classes_taught")
    enrollments: Mapped[list["ClassEnrollment"]] = relationship(back_populates="class_", cascade="all, delete-orphan")
    posts: Mapped[list["Post"]] = relationship(back_populates="class_", cascade="all, delete-orphan")
    assignments: Mapped[list["Assignment"]] = relationship(back_populates="class_", cascade="all, delete-orphan")


# ---------------------------------------------------------------------
# 3. class_enrollments
# ---------------------------------------------------------------------
class ClassEnrollment(Base):
    __tablename__ = "class_enrollments"
    __table_args__ = (UniqueConstraint("class_id", "student_id", name="uq_class_student"),)

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    class_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    class_: Mapped["Class"] = relationship(back_populates="enrollments")
    student: Mapped["User"] = relationship(back_populates="enrollments")


# ---------------------------------------------------------------------
# 4. posts
# ---------------------------------------------------------------------
class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    class_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("classes.id", ondelete="CASCADE"))
    author_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    class_: Mapped["Class"] = relationship(back_populates="posts")
    author: Mapped["User"] = relationship()
    attachments: Mapped[list["Attachment"]] = relationship(back_populates="post", cascade="all, delete-orphan")
    comments: Mapped[list["Comment"]] = relationship(back_populates="post", cascade="all, delete-orphan")


# ---------------------------------------------------------------------
# 5. attachments
# ---------------------------------------------------------------------
class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    post_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("posts.id", ondelete="CASCADE"))
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[str | None] = mapped_column(String(255))
    file_type: Mapped[str | None] = mapped_column(String(150))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    post: Mapped["Post"] = relationship(back_populates="attachments")


# ---------------------------------------------------------------------
# 6. comments
# ---------------------------------------------------------------------
class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    post_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("posts.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"))
    parent_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    post: Mapped["Post"] = relationship(back_populates="comments")
    user: Mapped["User"] = relationship()


# ---------------------------------------------------------------------
# 7. assignments
# ---------------------------------------------------------------------
class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    class_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("classes.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    max_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=10)
    file_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    class_: Mapped["Class"] = relationship(back_populates="assignments")
    submissions: Mapped[list["Submission"]] = relationship(back_populates="assignment", cascade="all, delete-orphan")


# ---------------------------------------------------------------------
# 8. submissions
# ---------------------------------------------------------------------
class Submission(Base):
    __tablename__ = "submissions"
    __table_args__ = (UniqueConstraint("assignment_id", "student_id", name="uq_assignment_student"),)

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    assignment_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("assignments.id", ondelete="CASCADE"))
    student_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"))
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[SubmissionState] = mapped_column(
        Enum(SubmissionState, name="submission_state"), nullable=False, default=SubmissionState.ON_TIME
    )
    grade: Mapped[float | None] = mapped_column(Numeric(5, 2))
    feedback: Mapped[str | None] = mapped_column(Text)

    assignment: Mapped["Assignment"] = relationship(back_populates="submissions")
    student: Mapped["User"] = relationship(back_populates="submissions")


# ---------------------------------------------------------------------
# 9. document_chunks (for RAG)
# ---------------------------------------------------------------------
class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    
    # Rất quan trọng để cách ly dữ liệu giữa các lớp học
    class_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("classes.id", ondelete="CASCADE"))
    
    # Phân loại nguồn gốc của chunk này (Ví dụ: 'POST', 'ATTACHMENT', 'ASSIGNMENT')
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # ID của bản ghi gốc (Ví dụ: id của bảng attachments)
    source_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    
    # Nội dung đoạn text đã được cắt nhỏ
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Vector nhúng sinh ra từ Google Gemini (thường là 768 chiều cho models text-embedding)
    embedding: Mapped[list[float]] = mapped_column(Vector(768))
    
    # Siêu dữ liệu thêm (tên file, số trang, người đăng...)
    metadata_json: Mapped[dict] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
