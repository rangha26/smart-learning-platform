from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from app.models import SubmissionState
from app.schemas.classes import UserSummaryResponse

class AssignmentCreateRequest(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    due_date: datetime
    max_score: float = Field(default=10.0, ge=0)
    file_url: Optional[str] = None

class AssignmentResponse(BaseModel):
    id: int
    class_id: int
    title: str
    description: Optional[str] = None
    due_date: datetime
    max_score: float
    file_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SubmissionCreateRequest(BaseModel):
    file_url: str = Field(..., description="URL của file nộp bài")

class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    file_url: str
    submitted_at: datetime
    status: SubmissionState
    grade: Optional[float] = None
    feedback: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class GradeSubmissionRequest(BaseModel):
    grade: float = Field(..., ge=0, description="Điểm số của bài nộp")
    feedback: Optional[str] = Field(None, description="Phản hồi cho bài nộp")

class AssignmentStatsResponse(BaseModel):
    assignment_title: str
    total_students: int
    submitted_count: int
    not_submitted_count: int
    details: dict

    model_config = ConfigDict(from_attributes=True)

class AssignmentListResponse(BaseModel):
    total_count: int
    page: int
    page_size: int
    assignments: list[AssignmentResponse]

    model_config = ConfigDict(from_attributes=True)

class StudentSubmissionReport(BaseModel):
    student: UserSummaryResponse
    is_submitted: bool
    submission_id: Optional[int] = None
    status: Optional[SubmissionState] = None
    grade: Optional[float] = None
    submitted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AssignmentFullReportResponse(BaseModel):
    assignment_id: int
    title: str
    total_enrolled: int
    submitted_count: int
    graded_count: int
    students: list[StudentSubmissionReport]

    model_config = ConfigDict(from_attributes=True)
