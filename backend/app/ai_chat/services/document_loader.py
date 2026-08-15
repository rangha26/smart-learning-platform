"""
Module: document_loader.py
Mục đích: Cung cấp các hàm tiện ích để tải và trích xuất nội dung văn bản (raw text) từ 
          các định dạng tệp tin phổ biến (.pdf, .docx, .pptx, .xlsx, .txt, .csv) 
          nhằm phục vụ cho hệ thống Chatbot RAG.

Tính năng nổi bật:
- Hỗ trợ tải file trực tiếp từ URL (Supabase Storage) hoặc đọc từ đường dẫn local.
- Tự động nhận diện định dạng file thông qua đuôi mở rộng.
- Hỗ trợ tự động sửa lỗi font tiếng Việt cũ (mã hoá TCVN3/ABC) thường gặp trong các file PDF/DOC giáo trình cũ.

Dependencies yêu cầu:
- pdfplumber (đọc PDF)
- python-docx (đọc Word)
- python-pptx (đọc PowerPoint)
- openpyxl (đọc Excel)
- requests (tải file)
"""

import os
import tempfile
import requests
import pdfplumber
import docx
from pptx import Presentation
import openpyxl

def extract_text_from_pdf(file_path: str) -> str:
    text = []
    with pdfplumber.open(file_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            page_text = page.extract_text()
            if page_text:
                text.append(f"## Trang {i}")
                text.append(page_text)
    return "\n".join(text)

def extract_text_from_docx(file_path: str) -> str:
    doc = docx.Document(file_path)
    text = []
    for para in doc.paragraphs:
        txt = para.text.strip()
        if txt:
            style_name = para.style.name if para.style else ""
            if style_name.startswith("Heading"):
                try:
                    level = int(style_name.split(' ')[-1])
                    text.append(f"{'#' * level} {txt}")
                except ValueError:
                    text.append(f"## {txt}")
            else:
                text.append(txt)
    return "\n".join(text)

def extract_text_from_pptx(file_path: str) -> str:
    try:
        prs = Presentation(file_path)
    except Exception as e:
        if "Package not found" in str(e):
            raise ValueError("File PowerPoint không đúng chuẩn OOXML (có thể là file .ppt cũ bị đổi đuôi .pptx).")
        raise e
        
    text = []
    for i, slide in enumerate(prs.slides, start=1):
        text.append(f"## Slide {i}")
        for shape in slide.shapes:
            if hasattr(shape, "text") and shape.text.strip():
                text.append(shape.text.strip())
    return "\n".join(text)

def extract_text_from_xlsx(file_path: str) -> str:
    wb = openpyxl.load_workbook(file_path, data_only=True)
    text = []
    for sheet in wb.worksheets:
        text.append(f"## Sheet: {sheet.title}")
        for row in sheet.iter_rows(values_only=True):
            row_text = " | ".join([str(cell) for cell in row if cell is not None])
            if row_text:
                text.append(row_text)
    return "\n".join(text)

def extract_text_from_txt(file_path: str) -> str:
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def download_file_to_temp(url: str) -> str:
    response = requests.get(url)
    response.raise_for_status()
    # Create temp file
    fd, temp_path = tempfile.mkstemp()
    with os.fdopen(fd, 'wb') as f:
        f.write(response.content)
    return temp_path

def load_document_text(file_path_or_url: str, file_extension: str = None) -> str:
    """
    Tải file từ URL (hoặc đọc từ path local) và trích xuất text.
    file_extension có dạng '.pdf', '.docx', v.v. (kèm hoặc không kèm dấu chấm).
    """
    is_url = file_path_or_url.startswith('http://') or file_path_or_url.startswith('https://')
    
    if is_url:
        local_path = download_file_to_temp(file_path_or_url)
    else:
        local_path = file_path_or_url
        
    if not file_extension:
        _, ext = os.path.splitext(local_path)
        file_extension = ext.lower()
    else:
        file_extension = file_extension.lower()
        if not file_extension.startswith('.'):
            file_extension = '.' + file_extension
            
    text = ""
    try:
        if file_extension == '.pdf':
            text = extract_text_from_pdf(local_path)
        elif file_extension in ['.doc', '.docx']:
            text = extract_text_from_docx(local_path)
        elif file_extension in ['.ppt', '.pptx']:
            text = extract_text_from_pptx(local_path)
        elif file_extension in ['.xls', '.xlsx']:
            text = extract_text_from_xlsx(local_path)
        elif file_extension in ['.txt', '.csv']:
            text = extract_text_from_txt(local_path)
        else:
            raise ValueError(f"Định dạng {file_extension} chưa được hỗ trợ.")
    finally:
        if is_url and os.path.exists(local_path):
            os.remove(local_path)
            
    # Hỗ trợ sửa lỗi font TCVN3/ABC (rất hay gặp trong PDF cũ tiếng Việt)
    def decode_tcvn3(txt: str) -> str:
        TCVN3_MAP = {
            'µ': 'à', '¸': 'á', '¶': 'ả', '·': 'ã', '¹': 'ạ', '¨': 'ă', '»': 'ằ', '¾': 'ắ', '¼': 'ẳ', '½': 'ẵ', 'Æ': 'ặ',
            '©': 'â', 'Ç': 'ầ', 'Ê': 'ấ', 'È': 'ẩ', 'É': 'ẫ', 'Ë': 'ậ', '®': 'đ', 'Ì': 'è', 'Ð': 'é', 'Î': 'ẻ', 'Ï': 'ẽ', 'Ñ': 'ẹ',
            'ª': 'ê', 'Ò': 'ề', 'Õ': 'ế', 'Ó': 'ể', 'Ô': 'ễ', 'Ö': 'ệ', '×': 'ì', 'Ý': 'í', 'Ø': 'ỉ', 'Ü': 'ĩ', 'Þ': 'ị',
            'ß': 'ò', 'ã': 'ó', 'á': 'ỏ', 'â': 'õ', 'ä': 'ọ', '«': 'ô', 'å': 'ồ', 'è': 'ố', 'æ': 'ổ', 'ç': 'ỗ', 'é': 'ộ',
            '¬': 'ơ', 'ê': 'ờ', 'í': 'ớ', 'ë': 'ở', 'ì': 'ỡ', 'î': 'ợ', 'ï': 'ù', 'ó': 'ú', 'ñ': 'ủ', 'ò': 'ũ', 'ô': 'ụ',
            '\xad': 'ư', 'õ': 'ừ', 'ø': 'ứ', 'ö': 'ử', '÷': 'ữ', 'ù': 'ự', 'ú': 'ỳ', 'ý': 'ý', 'û': 'ỷ', 'ü': 'ỹ', 'þ': 'ỵ',
            '¡': 'Ă', '¢': 'Â', '§': 'Đ', '£': 'Ê', '¤': 'Ô', '¥': 'Ơ', '¦': 'Ư'
        }
        tcvn3_sus_chars = set('µ¸¶·¹¨»¾¼½Æ©ÇÊÈË®ÌÐÎÏÑªÒÕÓÖ×ÝØÜÞßä«åæç¬ëîïñ÷ûüþ¡¢§£¤¥¦')
        
        # Nếu văn bản có chứa một lượng ký tự TCVN3 đặc trưng, tiến hành fix
        if sum(1 for c in txt if c in tcvn3_sus_chars) > 5:
            import re
            def fix_word(match):
                word = match.group(0)
                if any(c in tcvn3_sus_chars for c in word):
                    res = list(word)
                    for i, c in enumerate(res):
                        if c in TCVN3_MAP:
                            res[i] = TCVN3_MAP[c]
                    word = "".join(res)
                    upper_count = sum(1 for c in word if c.isupper())
                    lower_count = sum(1 for c in word if c.islower())
                    if upper_count >= 2 and lower_count >= 1:
                        return word.upper()
                return word
            return re.sub(r'\S+', fix_word, txt)
        return txt
        
    text = decode_tcvn3(text)
    
    # Xoá khoảng trắng thừa
    return "\n".join([line.strip() for line in text.splitlines() if line.strip()])

# ==========================================
# KHU VỰC TEST (Chỉ chạy khi gọi trực tiếp file này)
# ==========================================
if __name__ == "__main__":
    print("--- Đang test với các file local ---")
    files = [
        "/Users/nangvuong/Downloads/857565257-KI-NANG-DOC-HIEU-VB-TRUYEN.docx",
        "/Users/nangvuong/Downloads/Giáo trình Phát triển hệ thống thương mại điện tử Phần 1.pdf",
    ]
    
    for f in files:
        if os.path.exists(f):
            print(f"\n>> Đang đọc: {os.path.basename(f)}")
            try:
                content = load_document_text(f)
                print(f"Thành công! Trích xuất được {len(content)} ký tự.")
                print(f"Preview 150 ký tự đầu: {content[:150]}...")
            except Exception as e:
                print(f"Lỗi khi đọc file: {e}")
        else:
            print(f"File không tồn tại: {f}")
