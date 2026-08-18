"""
Test quyền truy cập API AI Chat (/classes/{class_id}/ai-chat/*).

BẮT BUỘC PHẢI PASS TRƯỚC KHI MERGE feature/chat-bot VÀO develop.

Tại thời điểm viết test này, backend/app/ai_chat/router.py KHÔNG có bất kỳ
bước xác thực/phân quyền nào (không Depends(get_current_user), không gọi
_ensure_can_view_class như mọi router khác trong dự án) — nghĩa là ai cũng
gọi được API, kể cả không đăng nhập hoặc không thuộc lớp học đó. Các test
dưới đây sẽ FAIL trên code hiện tại; phải sửa router rồi mới được merge.

Yêu cầu môi trường: DB dev đã migrate + seed (xem hướng dẫn chạy test).
"""
from tests.conftest import auth_headers

CHAT_ENDPOINT = "/api/v1/classes/{class_id}/ai-chat/message"
UPLOAD_ENDPOINT = "/api/v1/classes/{class_id}/ai-chat/documents"


class TestChatEndpointRequiresAuth:
    def test_no_token_is_rejected(self, client, class1_id):
        res = client.post(CHAT_ENDPOINT.format(class_id=class1_id), json={"message": "hi"})
        assert res.status_code in (401, 403), (
            "Goi /ai-chat/message khong kem token phai bi tu choi (401/403), "
            f"nhung nhan ve {res.status_code}. Router dang thieu Depends(get_current_user)."
        )

    def test_user_outside_class_is_rejected(self, client, class2_id, token_factory):
        # student3 KHONG tham gia lop WEB202 (class2) - xem app/seed.py
        token = token_factory("student3")
        res = client.post(
            CHAT_ENDPOINT.format(class_id=class2_id),
            json={"message": "Cho toi biet noi dung lop nay"},
            headers=auth_headers(token),
        )
        assert res.status_code == 403, (
            "HV khong thuoc lop phai bi tu choi 403 khi hoi AI chat cua lop do, "
            f"nhung nhan ve {res.status_code}. Thieu _ensure_can_view_class()."
        )

    def test_enrolled_student_is_not_blocked_by_permission_layer(self, client, class1_id, token_factory):
        # student1 CO trong class1 - request phai qua duoc buoc phan quyen.
        # Khong assert 200 cung vi con phu thuoc GOOGLE_API_KEY/model that con hoat dong
        # hay khong (xem test_vector_store.py va checklist truoc merge), nhung TUYET DOI
        # khong duoc la 401/403 mot khi da xac thuc + thuoc lop.
        token = token_factory("student1")
        res = client.post(
            CHAT_ENDPOINT.format(class_id=class1_id),
            json={"message": "Xin chao"},
            headers=auth_headers(token),
        )
        assert res.status_code not in (401, 403)


class TestUploadEndpointRequiresAuth:
    def test_no_token_is_rejected(self, client, class1_id):
        res = client.post(
            UPLOAD_ENDPOINT.format(class_id=class1_id),
            files={"file": ("note.txt", b"hello", "text/plain")},
        )
        assert res.status_code in (401, 403)

    def test_user_outside_class_is_rejected(self, client, class2_id, token_factory):
        token = token_factory("student3")
        res = client.post(
            UPLOAD_ENDPOINT.format(class_id=class2_id),
            files={"file": ("note.txt", b"hello", "text/plain")},
            headers=auth_headers(token),
        )
        assert res.status_code == 403

    def test_student_cannot_upload_only_instructor_or_admin_can(self, client, class1_id, token_factory):
        """
        Gia dinh thiet ke: nap tai lieu vao knowledge base chung cua lop nen theo
        cung quy tac voi dang bai (_ensure_can_post) - chi GV so huu lop/admin.
        Neu chu y do cua ban khac (vd HV cung duoc tu nap tai lieu ca nhan), sua
        lai test nay cho khop, nhung PHAI co mot quy tac ro rang thay vi khong
        kiem tra gi ca nhu hien tai.
        """
        token = token_factory("student1")  # HV, khong phai GV cua class1
        res = client.post(
            UPLOAD_ENDPOINT.format(class_id=class1_id),
            files={"file": ("note.txt", b"hello", "text/plain")},
            headers=auth_headers(token),
        )
        assert res.status_code == 403

    def test_owning_instructor_is_not_blocked_by_permission_layer(self, client, class1_id, token_factory):
        token = token_factory("teacher1")  # GV so huu class1
        res = client.post(
            UPLOAD_ENDPOINT.format(class_id=class1_id),
            files={"file": ("note.txt", b"Noi dung tai lieu mau.", "text/plain")},
            headers=auth_headers(token),
        )
        assert res.status_code not in (401, 403)
