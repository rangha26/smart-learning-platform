import re

TCVN3_MAP = {
    'µ': 'à', '¸': 'á', '¶': 'ả', '·': 'ã', '¹': 'ạ',
    '¨': 'ă', '»': 'ằ', '¾': 'ắ', '¼': 'ẳ', '½': 'ẵ', 'Æ': 'ặ',
    '©': 'â', 'Ç': 'ầ', 'Ê': 'ấ', 'È': 'ẩ', 'É': 'ẫ', 'Ë': 'ậ',
    '®': 'đ', 'Ì': 'è', 'Ð': 'é', 'Î': 'ẻ', 'Ï': 'ẽ', 'Ñ': 'ẹ',
    'ª': 'ê', 'Ò': 'ề', 'Õ': 'ế', 'Ó': 'ể', 'Ô': 'ễ', 'Ö': 'ệ',
    '×': 'ì', 'Ý': 'í', 'Ø': 'ỉ', 'Ü': 'ĩ', 'Þ': 'ị',
    'ß': 'ò', 'ã': 'ó', 'á': 'ỏ', 'â': 'õ', 'ä': 'ọ',
    '«': 'ô', 'å': 'ồ', 'è': 'ố', 'æ': 'ổ', 'ç': 'ỗ', 'é': 'ộ',
    '¬': 'ơ', 'ê': 'ờ', 'í': 'ớ', 'ë': 'ở', 'ì': 'ỡ', 'î': 'ợ',
    'ï': 'ù', 'ó': 'ú', 'ñ': 'ủ', 'ò': 'ũ', 'ô': 'ụ',
    '\xad': 'ư', 'õ': 'ừ', 'ø': 'ứ', 'ö': 'ử', '÷': 'ữ', 'ù': 'ự',
    'ú': 'ỳ', 'ý': 'ý', 'û': 'ỷ', 'ü': 'ỹ', 'þ': 'ỵ',
    '¡': 'Ă', '¢': 'Â', '§': 'Đ', '£': 'Ê', '¤': 'Ô', '¥': 'Ơ', '¦': 'Ư'
}

def detect_and_decode_tcvn3(text: str) -> str:
    # '¸' (á), '¶' (ả), '·' (ã), '¹' (ạ), 'µ' (à), '©' (â), '®' (đ)...
    # Các ký tự này cực kỳ hiếm trong văn bản Unicode bình thường
    tcvn3_sus_chars = set('µ¸¶·¹¨»¾¼½Æ©ÇÊÈË®ÌÐÎÏÑªÒÕÓÖ×ÝØÜÞßä«åæç¬ëîïñ÷ûüþ¡¢§£¤¥¦')
    
    def fix_word(match):
        word = match.group(0)
        # Nếu từ chứa ký tự đặc trưng TCVN3 -> dịch toàn bộ từ theo bảng TCVN3
        if any(c in tcvn3_sus_chars for c in word):
            res = list(word)
            for i, c in enumerate(res):
                if c in TCVN3_MAP:
                    res[i] = TCVN3_MAP[c]
            word = "".join(res)
            
            # Sửa chữ hoa (Ví dụ: TRƯờNG -> TRƯỜNG)
            upper_count = sum(1 for c in word if c.isupper())
            lower_count = sum(1 for c in word if c.islower())
            if upper_count >= 2 and lower_count >= 1:
                return word.upper()
            return word
        
        return word

    return re.sub(r'\S+', fix_word, text)

sample = "TR¦êNG §¹I HäC TH¦¥NG M¹I \r\nKHOA TH¦¥NG M¹I §IÖN Tö \r\nCHñ BI£N: PGS.TS. NGUYÔN V¡N MINH\r\nGiáo trình\r\nPH¸T TRIÓN HÖ THèNG\r\nTH¦¥NG M¹I §IÖN Tö \r\nNHµ XUÊT B¶N THèNG K£ \r\nHµ NéI, 2014"
print("Converted:")
print(detect_and_decode_tcvn3(sample))
