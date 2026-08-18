"""
Fixture dùng chung cho toàn bộ test suite.

Các test dùng session/user đã có sẵn trong app/seed.py, KHÔNG tự tạo dữ liệu
riêng, để không phụ thuộc vào việc DB test tách biệt (dự án hiện chưa có DB
test riêng — xem hướng dẫn chạy test trong phần trả lời của assistant).

Bảng seed liên quan (app/seed.py):
    teacher1 = teacher.nguyen@smartlearning.com  -> GV lớp "PYTHON101" (class1)
    teacher2 = teacher.tran@smartlearning.com    -> GV lớp "WEB202" (class2)
    student1 = student.dinh@smartlearning.com    -> HV của cả class1 và class2
    student2 = student.le@smartlearning.com      -> HV của cả class1 và class2
    student3 = student.pham@smartlearning.com    -> HV của class1 CHỈ (không có class2)
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db import SessionLocal
from app.models import Class

SEEDED_USERS = {
    "admin": ("admin@smartlearning.com", "AdminPassword123!"),
    "teacher1": ("teacher.nguyen@smartlearning.com", "TeacherPassword123!"),
    "teacher2": ("teacher.tran@smartlearning.com", "TeacherPassword123!"),
    "student1": ("student.dinh@smartlearning.com", "StudentPassword123!"),
    "student2": ("student.le@smartlearning.com", "StudentPassword123!"),
    "student3": ("student.pham@smartlearning.com", "StudentPassword123!"),
}


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def class1_id(db_session):
    """Lớp 'Lập trình Python Căn Bản' (join_code=PYTHON101)."""
    cls = db_session.query(Class).filter(Class.join_code == "PYTHON101").first()
    assert cls is not None, (
        "Không tìm thấy lớp seed PYTHON101. Chạy trước: "
        "docker exec smart_learning_backend python -c \"from app.seed import seed_data; seed_data()\""
    )
    return cls.id


@pytest.fixture(scope="session")
def class2_id(db_session):
    """Lớp 'Phát triển Web với FastAPI & React' (join_code=WEB202)."""
    cls = db_session.query(Class).filter(Class.join_code == "WEB202").first()
    assert cls is not None, "Không tìm thấy lớp seed WEB202. Xem ghi chú ở class1_id fixture."
    return cls.id


def _login(client: TestClient, email: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login thất bại cho {email}: {res.status_code} {res.text}"
    return res.json()["tokens"]["access_token"]


@pytest.fixture(scope="session")
def token_factory(client):
    """token_factory("teacher1") -> access token của user seed tương ứng (cache theo session)."""
    cache: dict[str, str] = {}

    def _get(user_key: str) -> str:
        if user_key not in cache:
            email, password = SEEDED_USERS[user_key]
            cache[user_key] = _login(client, email, password)
        return cache[user_key]

    return _get


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
