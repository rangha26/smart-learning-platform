# Setup PostgreSQL trên Docker + SQLAlchemy + Alembic

## 1. Chạy Postgres bằng Docker

```bash
cp .env.example .env
docker compose up -d
docker compose ps        # kiểm tra container "classroom_db" đang healthy
```

pgAdmin (tuỳ chọn, để xem DB qua giao diện web): http://localhost:5050

## 2. Cài Python dependencies

```bash
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 3. Khởi tạo Alembic (chỉ làm 1 lần)

```bash
alembic init alembic
```

Sau đó sửa 2 chỗ:

**`alembic.ini`** — xoá dòng `sqlalchemy.url = ...` (sẽ set động trong `env.py`).

**`alembic/env.py`** — thêm ở đầu file và sửa `target_metadata`:

```python
import os
import sys
sys.path.append(os.getcwd())

from dotenv import load_dotenv
load_dotenv()

from app.db import Base
from app.models import *  # noqa: import để Alembic thấy hết các model

target_metadata = Base.metadata

config.set_main_option(
    "sqlalchemy.url",
    os.getenv("DATABASE_URL", "postgresql+psycopg2://app_user:app_password@localhost:5432/classroom_db"),
)
```

## 4. Tạo migration đầu tiên & apply vào DB

```bash
alembic revision --autogenerate -m "init schema: users, classes, posts, assignments..."
alembic upgrade head
```

Lệnh `upgrade head` sẽ tạo toàn bộ bảng (users, classes, class_enrollments, posts,
attachments, comments, assignments, submissions, và **document_chunks**) trong Postgres đang chạy trong Docker.

*Lưu ý: Bảng `document_chunks` sử dụng kiểu dữ liệu `VECTOR(768)` nên bắt buộc image PostgreSQL trong Docker phải là `pgvector/pgvector:pg16`.*

## 5. Kiểm tra kết quả

```bash
docker exec -it classroom_db psql -U app_user -d classroom_db -c "\dt"
```

## Quy trình khi thay đổi model sau này

1. Sửa file trong `app/models.py`
2. `alembic revision --autogenerate -m "mô tả thay đổi"`
3. Đọc lại file migration mới sinh ra trong `alembic/versions/` (autogenerate không phải
   lúc nào cũng đúng 100%, đặc biệt với đổi tên cột — cần soát tay)
4. `alembic upgrade head`
