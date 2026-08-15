import pypdfium2 as pdfium
import sys

def extract(path):
    pdf = pdfium.PdfDocument(path)
    text = ""
    for i in range(min(2, len(pdf))):
        page = pdf[i]
        textpage = page.get_textpage()
        text += textpage.get_text_bounded() + "\n"
    return text

print(repr(extract("/Users/nangvuong/Downloads/Giáo trình Phát triển hệ thống thương mại điện tử Phần 1.pdf")[:200]))
