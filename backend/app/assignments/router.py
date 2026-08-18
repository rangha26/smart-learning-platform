from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db import get_db
from app.models import Assignment, User, UserRole, Class, Submission, SubmissionState, ClassEnrollment
from app.auth.dependencies import get_current_user, require_roles
from app.core import BadRequestException, ForbiddenException, NotFoundException
from app.schemas import MessageResponse
from app.schemas.assignments import AssignmentResponse, AssignmentListResponse, AssignmentStatsResponse, SubmissionResponse, GradeSubmissionRequest
from app.classes.router import _get_class_or_404
from datetime import datetime, timezone
from fastapi import File, Form, UploadFile
from typing import Optional
from app.core.supabase import upload_file_to_supabase

router = APIRouter(
    prefix="/assignments",
    tags=["Assignments"]
)

@router.post("/classes/{class_id}/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED, summary="Tạo bài tập mới cho lớp học")

async def create_assignment(
    class_id: int, 
    title: str = Form(...),
    description: Optional[str] = Form(None),
    due_date: datetime = Form(...),
    max_score: float = Form(10),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_roles(UserRole.INSTRUCTOR))
):
    """
    Tạo một bài tập mới cho lớp học được chỉ định.
    Chỉ giáo viên của lớp học mới có quyền tạo bài tập.
    """
    # Kiểm tra xem lớp học có tồn tại không
    class_instance = _get_class_or_404(db, class_id)

    # Kiểm tra quyền của người dùng hiện tại
    if class_instance.instructor_id != current_user.id:
        raise ForbiddenException(message="Bạn không có quyền tạo bài tập cho lớp học này.")

    due_date_reference = due_date if due_date.tzinfo else due_date.replace(tzinfo=timezone.utc)
    if due_date_reference <= datetime.now(timezone.utc):
        raise BadRequestException(message="Hạn nộp phải là một thời điểm trong tương lai.")

    # Upload file nếu có
    file_url = None
    if file:
        file_url = await upload_file_to_supabase(file, folder="assignments")

    # Tạo bài tập mới
    new_assignment = Assignment(
        class_id=class_id,
        title=title,
        description=description,
        due_date=due_date,
        max_score=max_score,
        file_url=file_url
    )
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)

    return new_assignment

@router.post("/{assignment_id}/submit", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED, summary="Nộp bài tập")
async def submit_assignment(
    assignment_id: int, 
    file: UploadFile = File(...),
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_roles(UserRole.STUDENT))
):
    """
    Nộp bài tập cho một bài tập cụ thể.
    Chỉ sinh viên đã đăng ký lớp học mới có quyền nộp bài tập.
    """
    # Kiểm tra xem bài tập có tồn tại không
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise NotFoundException(message="Bài tập không tồn tại.")

    # Kiểm tra xem sinh viên có đăng ký lớp học không
    enrollment = db.query(ClassEnrollment).filter(ClassEnrollment.class_id == assignment.class_id, ClassEnrollment.student_id == current_user.id).first()
    if not enrollment:
        raise ForbiddenException(message="Bạn không có quyền nộp bài tập cho lớp học này.")

    # Upload bài làm lên Supabase
    file_url = await upload_file_to_supabase(file, folder="submissions")

    # Kiểm tra xem sinh viên đã nộp bài tập chưa
    existing_submission = db.query(Submission).filter(Submission.assignment_id == assignment_id, Submission.student_id == current_user.id).first()
    if existing_submission:
        existing_submission.file_url = file_url
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
        file_url=file_url,
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
        raise NotFoundException(message="Bài tập không tồn tại.")

    # Kiểm tra quyền của người dùng hiện tại
    classroom = db.query(Class).filter(Class.id == assignment.class_id).first()
    if classroom.instructor_id != current_user.id:
        raise ForbiddenException(message="Bạn không có quyền xem danh sách nộp bài tập cho lớp học này.")
    submissions = db.query(Submission).filter(Submission.assignment_id == assignment_id).all()
    return submissions

@router.delete("/{assignment_id}/unsubmit", response_model=MessageResponse, summary="Hủy nộp bài tập (chỉ dành cho sinh viên)")
def unsubmit_assignment(assignment_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.STUDENT))):
    """
    Hủy nộp bài tập cho một bài tập cụ thể.
    Chỉ sinh viên đã nộp bài tập mới có quyền hủy nộp.
    """
    # Kiểm tra xem bài tập có tồn tại không
    submission = db.query(Submission).filter(Submission.assignment_id == assignment_id, Submission.student_id == current_user.id).first()

    # Kiểm tra xem sinh viên đã nộp bài tập chưa
    if not submission:
        raise NotFoundException(message="Bạn chưa nộp bài tập này hoặc bài tập không tồn tại.")

    # Kiểm tra xem bài tập đã được chấm điểm chưa
    if submission.grade is not None:
        raise ForbiddenException(message="Bạn không thể hủy nộp bài tập đã được chấm điểm.")

    # Hủy nộp bài tập
    db.delete(submission)
    db.commit()

    return MessageResponse(message="Hủy nộp bài tập thành công.")

@router.get("", response_model=AssignmentListResponse, summary="Lấy danh sách bài tập của người dùng hiện tại")
def list_my_assignments(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    class_id: Optional[int] = Query(None, description="Chỉ lấy bài tập của một lớp cụ thể"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lấy danh sách bài tập liên quan tới người dùng hiện tại:
    - Admin: toàn bộ bài tập.
    - Giảng viên: bài tập của các lớp mình phụ trách.
    - Học viên: bài tập của các lớp mình đã tham gia.

    Truyền class_id để lọc riêng bài tập của một lớp (áp dụng SAU khi đã giới
    hạn theo quyền ở trên, nên không thể dùng để xem lớp mình không thuộc về).
    """
    query = db.query(Assignment)

    if current_user.role == UserRole.INSTRUCTOR:
        query = query.join(Class, Class.id == Assignment.class_id).filter(Class.instructor_id == current_user.id)
    elif current_user.role == UserRole.STUDENT:
        query = query.join(ClassEnrollment, ClassEnrollment.class_id == Assignment.class_id).filter(
            ClassEnrollment.student_id == current_user.id
        )

    if class_id is not None:
        query = query.filter(Assignment.class_id == class_id)

    total_count = query.count()

    assignments = query.order_by(Assignment.due_date.asc()).offset((page - 1) * page_size).limit(page_size).all()

    return AssignmentListResponse(
        total_count=total_count,
        page=page,
        page_size=page_size,
        assignments=assignments
    )

@router.patch("/submissions/{submission_id}/grade", response_model=SubmissionResponse, summary="Chấm điểm bài nộp (chỉ dành cho giáo viên)")
def grade_submission(submission_id: int, grade_request: GradeSubmissionRequest, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.INSTRUCTOR))):
    """
    Chấm điểm cho một bài nộp cụ thể.
    Chỉ giáo viên của lớp học mới có quyền chấm điểm.
    """
    # Kiểm tra xem bài nộp có tồn tại không
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise NotFoundException(message="Bài nộp không tồn tại.")

    # Kiểm tra xem giáo viên có quyền chấm điểm bài nộp này không
    assignment = db.query(Assignment).filter(Assignment.id == submission.assignment_id).first()
    classroom = db.query(Class).filter(Class.id == assignment.class_id).first()
    if classroom.instructor_id != current_user.id:
        raise ForbiddenException(message="Bạn không có quyền chấm điểm bài nộp này.")

    # Kiểm tra xem điểm số có vượt quá điểm tối đa của bài tập không
    if grade_request.grade > assignment.max_score:
        raise ForbiddenException(message=f"Điểm số không được vượt quá {assignment.max_score}.")

    # Cập nhật điểm và phản hồi
    submission.grade = grade_request.grade
    submission.feedback = grade_request.feedback
    db.commit()
    db.refresh(submission)

    return submission

@router.get("/{assignment_id}/my-submission", response_model=SubmissionResponse, summary="Lấy bài nộp của sinh viên cho một bài tập cụ thể")
def get_my_submission(assignment_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.STUDENT))):
    """
    Lấy bài nộp của sinh viên cho một bài tập cụ thể.
    Chỉ sinh viên đã nộp bài tập mới có quyền xem bài nộp của mình.
    """
    # Kiểm tra xem bài tập có tồn tại không
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise NotFoundException(message="Bài tập không tồn tại.")

    # Kiểm tra xem sinh viên đã nộp bài tập chưa
    submission = db.query(Submission).filter(Submission.assignment_id == assignment_id, Submission.student_id == current_user.id).first()
    if not submission:
        raise NotFoundException(message="Bạn chưa nộp bài tập này.")

    return submission

@router.get("/{assignment_id}/stats", response_model=AssignmentStatsResponse, summary="Lấy thống kê nộp bài tập cho một bài tập cụ thể (chỉ dành cho giáo viên)")
def get_assignment_stats(assignment_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.INSTRUCTOR))):
    """
    Lấy thống kê nộp bài tập cho một bài tập cụ thể.
    Chỉ giáo viên của lớp học mới có quyền xem thống kê.
    """
    # Kiểm tra xem bài tập có tồn tại không
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise NotFoundException(message="Bài tập không tồn tại.")

    # Kiểm tra xem giáo viên có quyền xem thống kê bài tập này không
    stats = db.query(Submission.status, func.count(Submission.id).label("count")).filter(Submission.assignment_id == assignment_id).group_by(Submission.status).all()

    total_students = db.query(func.count(ClassEnrollment.id)).filter(ClassEnrollment.class_id == assignment.class_id).scalar() or 0

    result = {
        status.value: count for status, count in stats
    }
    submitted_count = sum(result.values())

    return AssignmentStatsResponse(
        assignment_title=assignment.title,
        total_students=total_students,
        submitted_count=submitted_count,
        not_submitted_count=total_students - submitted_count,
        details=result
    )
