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
from app.ai_chat.services.vector_store import search_similar_chunks

def get_llm_model() -> ChatGoogleGenerativeAI:
    """
    Khởi tạo mô hình ngôn ngữ lớn (LLM) của Google Gemini.
    Sử dụng gemini-1.5-flash-8b (phiên bản Lite siêu nhẹ và siêu nhanh của Gemini).
    """
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-flash-8b",
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.5 # Nhiệt độ trung bình để có thể sinh ra câu trả lời linh hoạt hơn nếu thiếu ngữ cảnh
    )

def generate_rag_response(db: Session, class_id: int, user_query: str) -> str:
    """
    Luồng RAG hoàn chỉnh (Retrieval-Augmented Generation):
    1. Tìm kiếm (Retrieve): Lấy các chunk tài liệu liên quan nhất từ Database.
    2. Tổng hợp (Augment): Ghép tài liệu vào một Prompt hướng dẫn.
    3. Sinh văn bản (Generate): Gửi Prompt cho Gemini để lấy câu trả lời.
    """
    
    # 1. Tìm tài liệu liên quan từ pgvector
    similar_chunks = search_similar_chunks(db=db, class_id=class_id, query=user_query, top_k=5)
    
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
    prompt_template = """
Bạn là một trợ lý giảng dạy AI thông minh của Hệ thống Smart Learning Platform.
Nhiệm vụ của bạn là giải đáp thắc mắc của học sinh.

QUY TẮC NGHIÊM NGẶT:
1. Ưu tiên CHỈ sử dụng thông tin có trong phần NGỮ CẢNH ĐƯỢC CUNG CẤP để trả lời.
2. NẾU phần NGỮ CẢNH KHÔNG CÓ thông tin để trả lời, BẠN ĐƯỢC PHÉP sử dụng kiến thức sẵn có của mình để trả lời. TUY NHIÊN, bạn PHẢI BẮT ĐẦU câu trả lời bằng một lời cảnh báo rõ ràng: "⚠️ Dựa vào tài liệu lớp học thì tôi không tìm thấy thông tin này. Tuy nhiên, theo kiến thức chung của tôi thì: ..."
3. Trình bày câu trả lời rõ ràng, thân thiện, mạch lạc, sử dụng bullet points (gạch đầu dòng) nếu cần thiết để học sinh dễ hiểu.

NGỮ CẢNH ĐƯỢC CUNG CẤP (Từ tài liệu lớp học):
{context}

CÂU HỎI CỦA HỌC SINH:
{question}

TRẢ LỜI:
"""
    prompt = PromptTemplate.from_template(prompt_template)
    formatted_prompt = prompt.format(context=context_text, question=user_query)
    
    # 4. Gửi cho LLM và nhận kết quả
    llm = get_llm_model()
    response = llm.invoke([HumanMessage(content=formatted_prompt)])
    
    return response.content
