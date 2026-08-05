from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Table, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from .base import Base

class ClassEnrollment(Base):
    __tablename__ = 'class_enrollments'
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey('classes.id'), nullable=False)
    student_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (UniqueConstraint('class_id', 'student_id', name='_class_student_uc'),)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default='STUDENT') 
    status = Column(String, default='ACTIVE') 
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    classes_teaching = relationship('Class', back_populates='instructor')
    enrollments = relationship('ClassEnrollment', backref='student')
    posts = relationship('Post', back_populates='author')
    comments = relationship('Comment', back_populates='user')
    submissions = relationship('Submission', back_populates='student')

class Class(Base):
    __tablename__ = 'classes'
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False) 
    subject = Column(String, nullable=False)
    description = Column(Text)
    join_code = Column(String, unique=True, index=True, nullable=False)
    instructor_id = Column(Integer, ForeignKey('users.id'))
    status = Column(String, default='ACTIVE')
    created_at = Column(DateTime, default=datetime.utcnow)

    instructor = relationship('User', back_populates='classes_teaching')
    posts = relationship('Post', back_populates='classroom')
    assignments = relationship('Assignment', back_populates='classroom')

class Post(Base):
    __tablename__ = 'posts'
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey('classes.id'), nullable=False)
    author_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    content = Column(Text, nullable=False)
    post_type = Column(String, default='announcement')
    created_at = Column(DateTime, default=datetime.utcnow)

    classroom = relationship('Class', back_populates='posts')
    author = relationship('User', back_populates='posts')
    attachments = relationship('Attachment', back_populates='post', cascade='all, delete-orphan')
    comments = relationship('Comment', back_populates='post', cascade='all, delete-orphan')

class Attachment(Base):
    __tablename__ = 'attachments'
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey('posts.id'), nullable=True)
    file_url = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String)
    file_size = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship('Post', back_populates='attachments')

class Comment(Base):
    __tablename__ = 'comments'
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey('posts.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship('Post', back_populates='comments')
    user = relationship('User', back_populates='comments')

class Assignment(Base):
    __tablename__ = 'assignments'
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey('classes.id'), nullable=False)
    title = Column(String, nullable=False)
    due_date = Column(DateTime, nullable=False)
    max_score = Column(Integer, default=10)
    file_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    classroom = relationship('Class', back_populates='assignments')
    submissions = relationship('Submission', back_populates='assignment')

class Submission(Base):
    __tablename__ = 'submissions'
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey('assignments.id'), nullable=False)
    student_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    file_url = Column(String, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default='SUBMITTED')
    grade = Column(Integer)
    feedback = Column(Text)

    assignment = relationship('Assignment', back_populates='submissions')
    student = relationship('User', back_populates='submissions')

class PasswordResetToken(Base):
    __tablename__ = 'password_reset_tokens'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)