"""
Module: llm_service.py
Mục đích: Bộ não của Chatbot. Nó nhận câu hỏi của người dùng, gọi vector_store để tìm kiếm tài liệu,
          sau đó đưa ngữ cảnh vào Prompt để hỏi Google Gemini sinh ra câu trả lời tự nhiên.
"""
from sqlalchemy.orm import Session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.messages import HumanMessage

from app.core.config import settings
from app.ai_chat.services.vector_store import search_similar_chunks_async

MODEL_MAPPING = {
    "Gemini 3.6 Flash": "gemini-3.6-flash",
    "Gemini 3.5 Flash Lite": "gemini-3.5-flash-lite",
    # gemini-2.5-flash-lite bị Google ngừng cấp cho user mới (404 NOT_FOUND,
    # khuyến nghị chính thức chuyển sang gemini-3.5-flash-lite).
    "Gemini 2.5 Flash Lite": "gemini-3.5-flash-lite",
    "Gemini 3.1 Flash Lite": "gemini-3.1-flash-lite",
    "Gemini 3.5 Flash": "gemini-3.5-flash",
    "Gemini 3.7 Flash": "gemini-3.7-flash",
}

def _extract_text(content) -> str:
    """
    response.content của langchain_google_genai có thể là str, hoặc (với một số
    model Gemini mới) list các content block dạng {"type": "text", "text": "..."}.
    Chuẩn hoá về plain string để client (frontend) không phải tự đoán format.
    """
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict) and block.get("type") == "text":
                parts.append(block.get("text", ""))
        return "".join(parts)
    return str(content)


def get_llm_model(model_name: str) -> ChatGoogleGenerativeAI:
    """
    Khởi tạo mô hình ngôn ngữ lớn (LLM) của Google Gemini.
    Chuyển đổi tên model người dùng chọn sang model API thực tế.
    """
    actual_model = MODEL_MAPPING.get(model_name, "gemini-3.5-flash")
    
    return ChatGoogleGenerativeAI(
        model=actual_model,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.5 # Nhiệt độ trung bình để có thể sinh ra câu trả lời linh hoạt hơn nếu thiếu ngữ cảnh
    )

async def generate_rag_response_async(db: Session, class_id: int, user_query: str, model_name: str = "Gemini 3.5 Flash Lite", user_role: str = "STUDENT") -> str:
    """
    Luồng RAG hoàn chỉnh (Retrieval-Augmented Generation) (Async):
    1. Tìm kiếm (Retrieve): Lấy các chunk tài liệu liên quan nhất từ Database.
    2. Tổng hợp (Augment): Ghép tài liệu vào một Prompt hướng dẫn.
    3. Sinh văn bản (Generate): Gửi Prompt cho Gemini để lấy câu trả lời.
    """
    
    # 1. Tìm tài liệu liên quan từ pgvector (Bất đồng bộ)
    similar_chunks = await search_similar_chunks_async(db=db, class_id=class_id, query=user_query, top_k=5)
    
    # 2. Xây dựng Context (Ngữ cảnh)
    context_text = ""
    if similar_chunks:
        for idx, chunk in enumerate(similar_chunks, start=1):
            meta = chunk.metadata_json or {}
            headers = " > ".join(meta.values()) if meta else "Tài liệu"
            context_text += f"\n--- Nguồn {idx} (Từ: {headers}) ---\n{chunk.content}\n"
    else:
        context_text = "Không tìm thấy tài liệu nào trong lớp học liên quan đến câu hỏi này."
        
    # 3. Định nghĩa Prompt Template (Dặn dò AI)
    if user_role == "INSTRUCTOR":
        prompt_template = """
Bạn là một trợ lý giảng dạy AI thông minh của Hệ thống Smart Learning Platform.
Nhiệm vụ của bạn là hỗ trợ Giảng viên (người đang trò chuyện với bạn) quản lý lớp học và giải đáp các thông tin liên quan đến lớp học.

QUY TẮC NGHIÊM NGẶT:
1. Ưu tiên CHỈ sử dụng thông tin có trong phần NGỮ CẢNH ĐƯỢC CUNG CẤP để trả lời.
2. NẾU phần NGỮ CẢNH KHÔNG CÓ thông tin để trả lời, BẠN ĐƯỢC PHÉP sử dụng kiến thức sẵn có của mình để trả lời. TUY NHIÊN, bạn PHẢI BẮT ĐẦU câu trả lời bằng một lời cảnh báo rõ ràng: "⚠️ Dựa vào tài liệu lớp học thì tôi không tìm thấy thông tin này. Tuy nhiên, theo kiến thức chung của tôi thì: ..."
3. TUYỆT ĐỐI KHÔNG tự bịa đặt, sáng tác các nội dung liên quan đến: Nội quy lớp học, Quy định, Thông báo, Điểm số, Lịch học. Đối với những thông tin đặc thù này, nếu NGỮ CẢNH không đề cập, bạn PHẢI trả lời: "⚠️ Tài liệu lớp học hiện chưa có thông tin về vấn đề này." và không được giải thích thêm.
4. Trình bày câu trả lời chuyên nghiệp, mạch lạc, tôn trọng, sử dụng bullet points (gạch đầu dòng) nếu cần thiết để giảng viên dễ theo dõi.

NGỮ CẢNH ĐƯỢC CUNG CẤP (Từ tài liệu lớp học):
{context}

CÂU HỎI CỦA GIẢNG VIÊN:
{question}

TRẢ LỜI:
"""
    else:
        prompt_template = """
Bạn là một trợ lý giảng dạy AI thông minh của Hệ thống Smart Learning Platform.
Nhiệm vụ của bạn là giải đáp thắc mắc của học sinh.

QUY TẮC NGHIÊM NGẶT:
1. Ưu tiên CHỈ sử dụng thông tin có trong phần NGỮ CẢNH ĐƯỢC CUNG CẤP để trả lời.
2. NẾU phần NGỮ CẢNH KHÔNG CÓ thông tin để trả lời, BẠN ĐƯỢC PHÉP sử dụng kiến thức sẵn có của mình để trả lời. TUY NHIÊN, bạn PHẢI BẮT ĐẦU câu trả lời bằng một lời cảnh báo rõ ràng: "⚠️ Dựa vào tài liệu lớp học thì tôi không tìm thấy thông tin này. Tuy nhiên, theo kiến thức chung của tôi thì: ..."
3. TUYỆT ĐỐI KHÔNG tự bịa đặt, sáng tác các nội dung liên quan đến: Nội quy lớp học, Quy định, Thông báo, Điểm số, Lịch học. Đối với những thông tin đặc thù này, nếu NGỮ CẢNH không đề cập, bạn PHẢI trả lời: "⚠️ Tài liệu lớp học hiện chưa có thông tin về vấn đề này." và không được giải thích thêm.
4. Trình bày câu trả lời rõ ràng, thân thiện, mạch lạc, sử dụng bullet points (gạch đầu dòng) nếu cần thiết để học sinh dễ hiểu.

NGỮ CẢNH ĐƯỢC CUNG CẤP (Từ tài liệu lớp học):
{context}

CÂU HỎI CỦA HỌC SINH:
{question}

TRẢ LỜI:
"""
    
    prompt = PromptTemplate.from_template(prompt_template)
    formatted_prompt = prompt.format(context=context_text, question=user_query)
    
    # 4. Gửi cho LLM và nhận kết quả (Bất đồng bộ)
    llm = get_llm_model(model_name)
    response = await llm.ainvoke([HumanMessage(content=formatted_prompt)])

    return _extract_text(response.content)
