from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AdminDashboardResponse(BaseModel):
    total_users: int
    total_students: int
    total_instructors: int
    total_admins: int
    total_classes: int
    active_classes: int
    archived_classes: int
    total_assignments: int
    total_submissions: int

    model_config = ConfigDict(from_attributes=True)


class TeacherClassSummary(BaseModel):
    id: int
    title: str
    subject: Optional[str] = None
    student_count: int
    status: str

    model_config = ConfigDict(from_attributes=True)


class UpcomingAssignmentSummary(BaseModel):
    id: int
    title: str
    class_id: int
    class_title: str
    due_date: datetime
    submitted: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)


class TeacherDashboardResponse(BaseModel):
    active_classes: int
    total_learners: int
    ungraded_submissions: int
    classes: list[TeacherClassSummary]
    upcoming_assignments: list[UpcomingAssignmentSummary]


class StudentDashboardResponse(BaseModel):
    enrolled_classes: int
    submitted_count: int
    total_assignments: int
    overall_progress: float
    upcoming_assignments: list[UpcomingAssignmentSummary]

class TodoItem(BaseModel):
    assignment_id: int
    title: str
    class_title: str
    due_date: datetime
    status: str
