from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db import get_db
from app.models import Assignment, User, UserRole, Class, Submission, SubmissionState, ClassEnrollment
from app.auth.dependencies import get_current_user, require_roles
from app.core import ForbiddenException, NotFoundException
from app.schemas.assignments import AssignmentCreateRequest, AssignmentResponse, SubmissionCreateRequest, SubmissionResponse
from app.classes.router import _get_class_or_404
from datetime import datetime, timezone

router = APIRouter(
    prefix="/assignments",
    tags=["Assignments"]
)

@router.post("/classes/{class_id}/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED, summary="Tạo bài tập mới cho lớp học")

def create_assignment(class_id: int, assignment_request: AssignmentCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.INSTRUCTOR))):
    """
    Tạo một bài tập mới cho lớp học được chỉ định.
    Chỉ giáo viên của lớp học mới có quyền tạo bài tập.
    """
    # Kiểm tra xem lớp học có tồn tại không
    class_instance = _get_class_or_404(db, class_id)

    # Kiểm tra quyền của người dùng hiện tại
    if class_instance.instructor_id != current_user.id:
        raise ForbiddenException(detail="Bạn không có quyền tạo bài tập cho lớp học này.")

    # Tạo bài tập mới
    new_assignment = Assignment(
        class_id=class_id,
        title=assignment_request.title,
        description=assignment_request.description,
        due_date=assignment_request.due_date,
        max_score=assignment_request.max_score,
        file_url=assignment_request.file_url
    )
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)

    return new_assignment

@router.post("/{assignment_id}/submit", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED, summary="Nộp bài tập")
def submit_assignment(assignment_id: int, submission_request: SubmissionCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.STUDENT))):
    """
    Nộp bài tập cho một bài tập cụ thể.
    Chỉ sinh viên đã đăng ký lớp học mới có quyền nộp bài tập.
    """
    # Kiểm tra xem bài tập có tồn tại không
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise NotFoundException(detail="Bài tập không tồn tại.")

    # Kiểm tra xem sinh viên có đăng ký lớp học không
    enrollment = db.query(ClassEnrollment).filter(ClassEnrollment.class_id == assignment.class_id, ClassEnrollment.student_id == current_user.id).first()
    if not enrollment:
        raise ForbiddenException(detail="Bạn không có quyền nộp bài tập cho lớp học này.")

    # Kiểm tra xem sinh viên đã nộp bài tập chưa
    existing_submission = db.query(Submission).filter(Submission.assignment_id == assignment_id, Submission.student_id == current_user.id).first()
    if existing_submission:
        existing_submission.file_url = submission_request.file_url
        existing_submission.submitted_at = datetime.now(timezone.utc)
        existing_submission.status = (SubmissionState.LATE if existing_submission.submitted_at > assignment.due_date else SubmissionState.ON_TIME)
        db.commit()
        db.refresh(existing_submission)
        return existing_submission

    # Tạo nộp bài tập mới
    now = datetime.now(timezone.utc)
    submission_status = SubmissionState.LATE if now > assignment.due_date else SubmissionState.ON_TIME
    new_submission = Submission(
        assignment_id=assignment_id,
        student_id=current_user.id,
        file_url=submission_request.file_url,
        submitted_at=now,
        status=submission_status
    )
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)
    return new_submission

@router.get("/{assignment_id}/submissions", response_model=list[SubmissionResponse], summary="Lấy danh sách nộp bài tập cho một bài tập cụ thể (chỉ dành cho giáo viên)")
def get_submissions(assignment_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.INSTRUCTOR))):
    """
    Lấy danh sách nộp bài tập cho một bài tập cụ thể.
    Chỉ giáo viên của lớp học mới có quyền xem danh sách nộp bài tập.
    """
    # Kiểm tra xem bài tập có tồn tại không
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise NotFoundException(detail="Bài tập không tồn tại.")

    # Kiểm tra quyền của người dùng hiện tại
    classroom = db.query(Class).filter(Class.id == assignment.class_id).first()
    if classroom.instructor_id != current_user.id:
        raise ForbiddenException(detail="Bạn không có quyền xem danh sách nộp bài tập cho lớp học này.")
    submissions = db.query(Submission).filter(Submission.assignment_id == assignment_id).all()
    return submissions