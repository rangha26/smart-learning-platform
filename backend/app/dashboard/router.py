from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.db import get_db
from app.models import (
    Assignment,
    Class,
    ClassEnrollment,
    ClassStatus,
    Submission,
    User,
    UserRole,
)
from app.schemas import (
    AdminDashboardResponse,
    StudentDashboardResponse,
    TeacherClassSummary,
    TeacherDashboardResponse,
    UpcomingAssignmentSummary,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

UPCOMING_ASSIGNMENTS_LIMIT = 5


@router.get("/admin", response_model=AdminDashboardResponse)
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_students = (
        db.query(func.count(User.id)).filter(User.role == UserRole.STUDENT).scalar() or 0
    )
    total_instructors = (
        db.query(func.count(User.id)).filter(User.role == UserRole.INSTRUCTOR).scalar() or 0
    )
    total_admins = (
        db.query(func.count(User.id)).filter(User.role == UserRole.ADMIN).scalar() or 0
    )

    total_classes = db.query(func.count(Class.id)).scalar() or 0
    active_classes = (
        db.query(func.count(Class.id)).filter(Class.status == ClassStatus.ACTIVE).scalar() or 0
    )
    archived_classes = total_classes - active_classes

    total_assignments = db.query(func.count(Assignment.id)).scalar() or 0
    total_submissions = db.query(func.count(Submission.id)).scalar() or 0

    return AdminDashboardResponse(
        total_users=total_users,
        total_students=total_students,
        total_instructors=total_instructors,
        total_admins=total_admins,
        total_classes=total_classes,
        active_classes=active_classes,
        archived_classes=archived_classes,
        total_assignments=total_assignments,
        total_submissions=total_submissions,
    )


@router.get("/teacher", response_model=TeacherDashboardResponse)
def get_teacher_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INSTRUCTOR)),
):
    classes = (
        db.query(Class)
        .filter(Class.instructor_id == current_user.id)
        .order_by(Class.created_at.desc())
        .all()
    )
    class_ids = [class_.id for class_ in classes]
    active_classes = sum(1 for class_ in classes if class_.status == ClassStatus.ACTIVE)

    student_count_by_class: dict[int, int] = {}
    total_learners = 0
    ungraded_submissions = 0
    upcoming_assignments: list[Assignment] = []

    if class_ids:
        student_count_by_class = dict(
            db.query(ClassEnrollment.class_id, func.count(ClassEnrollment.id))
            .filter(ClassEnrollment.class_id.in_(class_ids))
            .group_by(ClassEnrollment.class_id)
            .all()
        )

        total_learners = (
            db.query(func.count(func.distinct(ClassEnrollment.student_id)))
            .filter(ClassEnrollment.class_id.in_(class_ids))
            .scalar()
            or 0
        )

        ungraded_submissions = (
            db.query(func.count(Submission.id))
            .join(Assignment, Assignment.id == Submission.assignment_id)
            .filter(Assignment.class_id.in_(class_ids), Submission.grade.is_(None))
            .scalar()
            or 0
        )

        now = datetime.now(timezone.utc)
        upcoming_assignments = (
            db.query(Assignment)
            .filter(Assignment.class_id.in_(class_ids), Assignment.due_date >= now)
            .order_by(Assignment.due_date.asc())
            .limit(UPCOMING_ASSIGNMENTS_LIMIT)
            .all()
        )

    class_title_by_id = {class_.id: class_.title for class_ in classes}

    return TeacherDashboardResponse(
        active_classes=active_classes,
        total_learners=total_learners,
        ungraded_submissions=ungraded_submissions,
        classes=[
            TeacherClassSummary(
                id=class_.id,
                title=class_.title,
                subject=class_.subject,
                student_count=student_count_by_class.get(class_.id, 0),
                status=class_.status.value,
            )
            for class_ in classes
        ],
        upcoming_assignments=[
            UpcomingAssignmentSummary(
                id=assignment.id,
                title=assignment.title,
                class_id=assignment.class_id,
                class_title=class_title_by_id.get(assignment.class_id, ""),
                due_date=assignment.due_date,
            )
            for assignment in upcoming_assignments
        ],
    )


@router.get("/student", response_model=StudentDashboardResponse)
def get_student_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
):
    enrolled_class_ids = [
        row[0]
        for row in db.query(ClassEnrollment.class_id)
        .filter(ClassEnrollment.student_id == current_user.id)
        .all()
    ]
    enrolled_classes = len(enrolled_class_ids)

    total_assignments = 0
    submitted_count = 0
    upcoming_assignments: list[Assignment] = []
    class_title_by_id: dict[int, str] = {}
    submitted_assignment_ids: set[int] = set()

    if enrolled_class_ids:
        total_assignments = (
            db.query(func.count(Assignment.id))
            .filter(Assignment.class_id.in_(enrolled_class_ids))
            .scalar()
            or 0
        )

        submitted_count = (
            db.query(func.count(func.distinct(Submission.assignment_id)))
            .join(Assignment, Assignment.id == Submission.assignment_id)
            .filter(
                Assignment.class_id.in_(enrolled_class_ids),
                Submission.student_id == current_user.id,
            )
            .scalar()
            or 0
        )

        submitted_assignment_ids = {
            row[0]
            for row in db.query(Submission.assignment_id)
            .filter(Submission.student_id == current_user.id)
            .all()
        }

        now = datetime.now(timezone.utc)
        upcoming_assignments = (
            db.query(Assignment)
            .filter(Assignment.class_id.in_(enrolled_class_ids), Assignment.due_date >= now)
            .order_by(Assignment.due_date.asc())
            .limit(UPCOMING_ASSIGNMENTS_LIMIT)
            .all()
        )

        class_title_by_id = dict(
            db.query(Class.id, Class.title).filter(Class.id.in_(enrolled_class_ids)).all()
        )

    overall_progress = (
        round((submitted_count / total_assignments) * 100, 1) if total_assignments else 0.0
    )

    return StudentDashboardResponse(
        enrolled_classes=enrolled_classes,
        submitted_count=submitted_count,
        total_assignments=total_assignments,
        overall_progress=overall_progress,
        upcoming_assignments=[
            UpcomingAssignmentSummary(
                id=assignment.id,
                title=assignment.title,
                class_id=assignment.class_id,
                class_title=class_title_by_id.get(assignment.class_id, ""),
                due_date=assignment.due_date,
                submitted=assignment.id in submitted_assignment_ids,
            )
            for assignment in upcoming_assignments
        ],
    )
