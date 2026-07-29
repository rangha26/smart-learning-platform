from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.db import SessionLocal, engine
from app.models import (
    User,
    UserRole,
    UserStatus,
    Class,
    ClassStatus,
    ClassEnrollment,
    Post,
    Attachment,
    Comment,
    Assignment,
    Submission,
    SubmissionState,
)


def seed_data():
    db: Session = SessionLocal()
    try:
        # Check if users already exist
        if db.query(User).first():
            print("Database already contains data. Skipping seed.")
            return

        print("Seeding sample data into database...")

        # 1. Create Users
        admin = User(
            email="admin@smartlearning.com",
            hashed_password="hashed_admin_password_123",
            full_name="Quản Trị Viên",
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
        )
        teacher1 = User(
            email="teacher.nguyen@smartlearning.com",
            hashed_password="hashed_teacher_password_123",
            full_name="Thầy Nguyễn Văn An",
            role=UserRole.INSTRUCTOR,
            status=UserStatus.ACTIVE,
        )
        teacher2 = User(
            email="teacher.tran@smartlearning.com",
            hashed_password="hashed_teacher_password_123",
            full_name="Cô Trần Thị Bình",
            role=UserRole.INSTRUCTOR,
            status=UserStatus.ACTIVE,
        )
        student1 = User(
            email="student.dinh@smartlearning.com",
            hashed_password="hashed_student_password_123",
            full_name="Đinh Hoàng Nam",
            role=UserRole.STUDENT,
            status=UserStatus.ACTIVE,
        )
        student2 = User(
            email="student.le@smartlearning.com",
            hashed_password="hashed_student_password_123",
            full_name="Lê Minh Anh",
            role=UserRole.STUDENT,
            status=UserStatus.ACTIVE,
        )
        student3 = User(
            email="student.pham@smartlearning.com",
            hashed_password="hashed_student_password_123",
            full_name="Phạm Quốc Bảo",
            role=UserRole.STUDENT,
            status=UserStatus.ACTIVE,
        )

        db.add_all([admin, teacher1, teacher2, student1, student2, student3])
        db.commit()

        # Refresh to get IDs
        db.refresh(teacher1)
        db.refresh(teacher2)
        db.refresh(student1)
        db.refresh(student2)
        db.refresh(student3)

        # 2. Create Classes
        class1 = Class(
            title="Lập trình Python Căn Bản",
            subject="Khoa Học Máy Tính",
            description="Khóa học giới thiệu ngôn ngữ lập trình Python từ cơ bản đến nâng cao.",
            join_code="PYTHON101",
            instructor_id=teacher1.id,
            status=ClassStatus.ACTIVE,
        )
        class2 = Class(
            title="Phát triển Web với FastAPI & React",
            subject="Công Nghệ Phần Mềm",
            description="Xây dựng ứng dụng Web Fullstack hiện đại với Python FastAPI và React.",
            join_code="WEB202",
            instructor_id=teacher2.id,
            status=ClassStatus.ACTIVE,
        )

        db.add_all([class1, class2])
        db.commit()

        db.refresh(class1)
        db.refresh(class2)

        # 3. Create Enrollments
        enrollments = [
            ClassEnrollment(class_id=class1.id, student_id=student1.id),
            ClassEnrollment(class_id=class1.id, student_id=student2.id),
            ClassEnrollment(class_id=class1.id, student_id=student3.id),
            ClassEnrollment(class_id=class2.id, student_id=student1.id),
            ClassEnrollment(class_id=class2.id, student_id=student2.id),
        ]
        db.add_all(enrollments)
        db.commit()

        # 4. Create Posts
        post1 = Post(
            class_id=class1.id,
            author_id=teacher1.id,
            content="Chào mừng tất cả các bạn học sinh đến với khóa học Lập trình Python! Vui lòng kiểm tra tài nguyên học tập đính kèm bên dưới.",
        )
        post2 = Post(
            class_id=class2.id,
            author_id=teacher2.id,
            content="Thông báo: Bài tập lớn môn Web Development sẽ có hạn nộp vào cuối tuần tới. Mọi thắc mắc hãy bình luận dưới bài viết này.",
        )
        db.add_all([post1, post2])
        db.commit()

        db.refresh(post1)
        db.refresh(post2)

        # 5. Create Attachments
        attachment1 = Attachment(
            post_id=post1.id,
            file_url="https://example.com/files/python_cheatsheet.pdf",
            file_name="python_cheatsheet.pdf",
            file_type="application/pdf",
        )
        db.add(attachment1)

        # 6. Create Comments
        comment1 = Comment(
            post_id=post1.id,
            user_id=student1.id,
            content="Cảm ơn thầy ạ! Em rất mong chờ bài học đầu tiên.",
        )
        comment2 = Comment(
            post_id=post1.id,
            user_id=student2.id,
            content="Thầy ơi tuần này học online hay offline ạ?",
        )
        db.add_all([comment1, comment2])
        db.commit()

        # 7. Create Assignments
        now = datetime.now(timezone.utc)
        assignment1 = Assignment(
            class_id=class1.id,
            title="Bài tập 1: Xử lý chuỗi và Danh sách trong Python",
            description="Hãy viết chương trình Python để xử lý danh sách sinh viên và sắp xếp theo điểm số.",
            due_date=now + timedelta(days=7),
            max_score=10.0,
            file_url="https://example.com/assignments/bt1_spec.pdf",
        )
        assignment2 = Assignment(
            class_id=class2.id,
            title="Bài tập 2: Thiết kế RESTful API với FastAPI",
            description="Tạo các Endpoint CRUD cho đối tượng Bài học trong ứng dụng.",
            due_date=now + timedelta(days=10),
            max_score=10.0,
            file_url="https://example.com/assignments/bt2_spec.pdf",
        )
        db.add_all([assignment1, assignment2])
        db.commit()

        db.refresh(assignment1)

        # 8. Create Submissions
        submission1 = Submission(
            assignment_id=assignment1.id,
            student_id=student1.id,
            file_url="https://example.com/submissions/dinhhoangnam_bt1.zip",
            status=SubmissionState.ON_TIME,
            grade=9.5,
            feedback="Bài làm xuất sắc, code tối ưu và có comment giải thích rõ ràng!",
        )
        submission2 = Submission(
            assignment_id=assignment1.id,
            student_id=student2.id,
            file_url="https://example.com/submissions/leminhanh_bt1.zip",
            status=SubmissionState.ON_TIME,
            grade=8.0,
            feedback="Bài làm tốt nhưng nên đặt tên biến rõ ràng hơn.",
        )
        db.add_all([submission1, submission2])
        db.commit()

        print("Sample data seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
