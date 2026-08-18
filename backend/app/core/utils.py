import bleach

def sanitize_html(text: str) -> str:
    "Xóa tất cả các thẻ HTML và trả về văn bản thuần túy."
    if not text:
        return ""
    # Sử dụng bleach để loại bỏ tất cả các thẻ HTML, chỉ giữ lại văn bản thuần túy
    return bleach.clean(text, tags=[], strip=True)