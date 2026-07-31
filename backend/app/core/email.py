"""
Module Gửi Email thông qua SMTP (SMTP Email Service Module)

Module này chịu trách nhiệm:
1. Tạo template HTML email gửi mã OTP xác thực đổi mật khẩu.
2. Gửi Email thông qua SMTP server (Gmail, SendGrid, Mailgun, v.v.).
3. Hỗ trợ chế độ Môi trường Phát triển (Development Fallback): Tự động log OTP ra Console nếu chưa cấu hình thông tin SMTP.
"""

import logging
import smtplib
from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger("app.email")


def generate_otp_html_content(otp_code: str, user_name: str = "") -> str:
    """Tạo nội dung HTML Email đẹp mắt chứa mã OTP"""
    name_display = f"Chào <strong>{user_name}</strong>," if user_name else "Chào bạn,"
    return f"""
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mã OTP Đặt Lại Mật Khẩu</title>
        <style>
            body {{
                font-family: 'Segoe UI', Arial, sans-serif;
                background-color: #f4f6f9;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 550px;
                margin: 30px auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            }}
            .header {{
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                color: #ffffff;
                padding: 30px 20px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 22px;
                font-weight: 600;
            }}
            .content {{
                padding: 30px 25px;
                color: #334155;
                line-height: 1.6;
            }}
            .otp-box {{
                background-color: #f1f5f9;
                border: 2px dashed #cbd5e1;
                border-radius: 10px;
                text-align: center;
                padding: 20px;
                margin: 25px 0;
            }}
            .otp-code {{
                font-size: 36px;
                font-weight: 800;
                letter-spacing: 8px;
                color: #4f46e5;
                margin: 0;
            }}
            .footer {{
                background-color: #f8fafc;
                padding: 15px 20px;
                text-align: center;
                font-size: 13px;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
            }}
            .warning {{
                color: #ef4444;
                font-size: 13px;
                margin-top: 15px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Smart Learning Platform</h1>
            </div>
            <div class="content">
                <p>{name_display}</p>
                <p>Bạn đã gửi yêu cầu đặt lại mật khẩu cho tài khoản tại hệ thống <strong>Smart Learning Platform</strong>.</p>
                <p>Dưới đây là mã xác thực OTP của bạn:</p>

                <div class="otp-box">
                    <p class="otp-code">{otp_code}</p>
                </div>

                <p>Mã OTP có hiệu lực trong vòng <strong>{settings.OTP_EXPIRE_MINUTES} phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
                <p class="warning">⚠️ Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc đổi mật khẩu ngay để bảo mật tài khoản.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 Smart Learning Platform. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """


def send_otp_email(to_email: str, otp_code: str, user_name: str = "") -> bool:
    """
    Gửi Email chứa mã OTP qua SMTP Server.
    Nếu chưa cấu hình SMTP_USER hoặc SMTP_PASSWORD, hàm sẽ tự động in mã OTP ra Console log.
    """
    # Nếu chưa cấu hình SMTP (Dev mode fallback)
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            f"⚠️ [SMTP NOT CONFIGURED] Mã OTP xác thực quên mật khẩu cho [{to_email}] là: >>> {otp_code} <<< (Hết hạn sau {settings.OTP_EXPIRE_MINUTES} phút)"
        )
        print(f"\n==========================================")
        print(f"📧 [DEV EMAIL SIMULATOR] To: {to_email}")
        print(f"🔑 OTP Code: {otp_code} (Valid for {settings.OTP_EXPIRE_MINUTES} mins)")
        print(f"==========================================\n")
        return True

    try:
        # Tạo đối tượng MIME Message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = Header(f"[{otp_code}] Mã OTP đặt lại mật khẩu - Smart Learning Platform", "utf-8")
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USER}>"
        msg["To"] = to_email

        # Gắn nội dung HTML vào email
        html_content = generate_otp_html_content(otp_code=otp_code, user_name=user_name)
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        # Kết nối tới SMTP Server (Khởi tạo kết nối TLS)
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, [to_email], msg.as_string())

        logger.info(f"✅ Gửi email OTP thành công tới: {to_email}")
        return True

    except Exception as e:
        logger.error(f"❌ Lỗi gửi email qua SMTP tới {to_email}: {str(e)}", exc_info=True)
        print(f"\n⚠️ [SMTP ERROR FALLBACK] OTP cho {to_email} là: {otp_code}\n")
        return False
