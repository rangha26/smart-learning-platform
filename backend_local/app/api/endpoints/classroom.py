from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.all_models import Class, User, ClassEnrollment
from app.schemas.classroom import ClassCreate, ClassResponse, ClassJoin, ClassMembersResponse
from app.schemas.response import ResponseSchema
from app.api.deps import check_class_membership, get_current_user, get_instructor
import secrets
import string

router = APIRouter()

def generate_unique_code(db: Session):
    """Generate a unique join code for a class."""
    while True:
        characters = string.ascii_lowercase + string.digits
        code = ''.join(secrets.choice(characters) for _ in range(6))
        existing_class = db.query(Class).filter(Class.join_code == code).first()
        if not existing_class:
            return code

@router.post("/create", response_model=ResponseSchema[ClassResponse])
def create_classroom(class_in: ClassCreate, db: Session = Depends(get_db), current_user: User = Depends(get_instructor)):
    """Create a new classroom."""
    if current_user.role != "INSTRUCTOR":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only instructors can create classrooms.")
    join_code = generate_unique_code(db)
    new_class = Class(
        title=class_in.title,
        subject=class_in.subject,
        description=class_in.description,
        join_code=join_code,
        instructor_id=current_user.id,
        status="ACTIVE"
    )
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return {
        "success": True,
        "message": "Classroom created successfully.",
        "data": new_class
    }

@router.post("/join", response_model=ResponseSchema[dict])
def join_classroom(data: ClassJoin, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    classroom = db.query(Class).filter(Class.join_code == data.join_code).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found.")

    if classroom.status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Classroom is not active.")

    already_enrolled = db.query(ClassEnrollment).filter(
        ClassEnrollment.class_id == classroom.id,
        ClassEnrollment.student_id == current_user.id
    ).first()

    if already_enrolled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are already enrolled in this classroom.")

    enrollment = ClassEnrollment(class_id=classroom.id, student_id=current_user.id)

    db.add(enrollment)
    db.commit()

    return {
        "success": True,
        "message": f"Successfully joined the classroom '{classroom.title}'.",
        "data": {
            "class_id": classroom.id,
            "class_title": classroom.title
        }
    }

@router.get("/my-classes", response_model=ResponseSchema[list[ClassResponse]])
def get_my_classes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all classrooms the current user is enrolled in."""
    if current_user.role == "INSTRUCTOR":
        classes = db.query(Class).filter(Class.instructor_id == current_user.id).all()
    else:
        classes = db.query(Class).join(ClassEnrollment).filter(ClassEnrollment.student_id == current_user.id).all()

    return {
        "success": True,
        "message": "Retrieved classrooms successfully.",
        "data": classes
    }

@router.get("/{class_id}/members", response_model=ResponseSchema[ClassMembersResponse])
def get_class_members(class_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all members of a classroom."""
    check_class_membership(class_id, current_user, db)
    classroom = db.query(Class).filter(Class.id == class_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found.")

    students = db.query(User).join(ClassEnrollment, User.id == ClassEnrollment.student_id).filter(ClassEnrollment.class_id == class_id).all()

    return {
        "success": True,
        "message": "Retrieved class members successfully.",
        "data": {
            "instructor": classroom.instructor,
            "instructor_id": classroom.instructor_id,
            "students": students,
            "total_students": len(students)
        }
    }