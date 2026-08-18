import { useState, useEffect, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Bot,
  Check,
  ChevronDown,
  Copy,
  GraduationCap,
  HelpCircle,
  Loader2,
  Maximize2,
  MessageSquare,
  Minimize2,
  RotateCcw,
  Send,
  Sparkles,
  User,
  Wand2,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/useAuth'
import { aiChatService } from '@/services/aiChatService'

// Khớp /teacher/class/:id hoặc /student/class/:id để lấy ngữ cảnh lớp học hiện tại
function getClassIdFromPath(pathname) {
  const match = pathname.match(/\/class\/(\d+)/)
  return match ? match[1] : null
}

const SUGGESTED_PROMPTS = [
  '💡 Làm sao để nộp bài tập và xem điểm?',
  '📚 Các bước thiết kế cơ sở dữ liệu chuẩn hoá là gì?',
  '🚀 Hướng dẫn viết RESTful API bằng FastAPI / Node.js',
  '❓ Cách liên hệ và trao đổi với giảng viên',
]

// Hướng dẫn nhanh dùng khi KHÔNG có ngữ cảnh lớp học cụ thể (không phải AI thật,
// chỉ trả lời được các câu hỏi thao tác chung trên nền tảng). Khi đang mở một lớp
// học cụ thể, widget sẽ gọi API RAG thật (xem handleSendMessage) thay vì hàm này.
function getGeneralHelpResponse(userMessage, userName = 'bạn') {
  const q = userMessage.toLowerCase()

  if (q.includes('nộp bài') || q.includes('submit') || q.includes('turn in') || q.includes('hạn nộp')) {
    return `Chào **${userName}**, để nộp bài tập trên hệ thống, bạn thực hiện theo các bước sau:\n\n1. Truy cập vào **Lớp học** của bạn và chọn tab **"Bài tập"** (hoặc chọn từ danh sách *Bài tập sắp đến hạn* ở trang chủ).\n2. Nhấn nút **"Xem đề & Nộp bài"** tại bài tập tương ứng.\n3. Đính kèm file bài làm (PDF, Word, Code, ZIP, RAR...) bằng cách kéo thả hoặc chọn tệp.\n4. Nhấn nút **"Nộp bài (Turn In)"** để hoàn tất.\n\n*Lưu ý:* Nếu nộp sau hạn chót, hệ thống sẽ tự động đánh dấu trạng thái **Nộp trễ (Late)**. Bạn có thể nhấn **Unsubmit** để nộp lại file mới nếu bài tập chưa được giảng viên chấm điểm.`
  }

  if (q.includes('cơ sở dữ liệu') || q.includes('database') || q.includes('sql') || q.includes('chuẩn hoá')) {
    return `Thiết kế **Cơ sở dữ liệu (Database Design)** tiêu chuẩn gồm các bước chính:\n\n1. **Xác định yêu cầu (Requirement Analysis):** Liệt kê các thực thể (Entities), thuộc tính (Attributes) và mối quan hệ (Relationships 1-1, 1-N, N-N).\n2. **Xây dựng sơ đồ ERD (Entity Relationship Diagram):** Định nghĩa khóa chính (Primary Key), khóa ngoại (Foreign Key).\n3. **Chuẩn hoá dữ liệu (Normalization):**\n   - **1NF:** Giá trị nguyên tố, không lặp nhóm cột.\n   - **2NF:** Đạt 1NF và mọi thuộc tính không khóa phụ thuộc hàm toàn phần vào khóa chính.\n   - **3NF:** Đạt 2NF và không có phụ thuộc bắc cầu giữa các thuộc tính không khóa.\n4. **Tạo bảng & Ràng buộc (DDL):** Sử dụng các ràng buộc \`NOT NULL\`, \`UNIQUE\`, \`CHECK\`, \`FOREIGN KEY\` và tạo Index cho các cột thường xuyên tìm kiếm.`
  }

  if (q.includes('api') || q.includes('restful') || q.includes('fastapi') || q.includes('backend')) {
    return `Để xây dựng **RESTful API** chuẩn mực, bạn nên tuân thủ các nguyên tắc sau:\n\n- **Sử dụng đúng HTTP Methods:**\n  - \`GET\`: Đọc dữ liệu (Idempotent, Safe)\n  - \`POST\`: Tạo mới tài nguyên\n  - \`PUT\` / \`PATCH\`: Cập nhật toàn phần hoặc một phần\n  - \`DELETE\`: Xóa tài nguyên\n- **Quy ước đặt tên Endpoint:** Sử dụng danh từ số nhiều, chữ thường (ví dụ: \`/api/classes\`, \`/api/assignments/{id}\`).\n- **Mã phản hồi HTTP Status Codes:** \`200 OK\`, \`201 Created\`, \`400 Bad Request\`, \`401 Unauthorized\`, \`403 Forbidden\`, \`404 Not Found\`, \`500 Internal Error\`.\n- **Xác thực & Phân quyền:** Sử dụng JWT Bearer Token trong Header \`Authorization: Bearer <token>\`.`
  }

  if (q.includes('giảng viên') || q.includes('thầy') || q.includes('cô') || q.includes('liên hệ')) {
    return `Bạn có thể trao đổi với Giảng viên bằng các cách sau:\n\n- **Bảng tin lớp học (Class Feed):** Đăng câu hỏi hoặc bình luận trực tiếp dưới bài thông báo của giảng viên trong lớp.\n- **Lời phê bài tập:** Xem phản hồi riêng tư của giảng viên ngay trong phần chi tiết bài làm đã chấm.\n- **Email lớp học:** Xem thông tin email của giảng viên tại tab **"Mọi người"** trong trang chi tiết lớp học.`
  }

  if (q.includes('chào') || q.includes('hi') || q.includes('hello') || q.includes('bạn là ai')) {
    return `Xin chào **${userName}**! 👋\n\nTôi là **AI Learning Assistant** của nền tảng Smart Learning. Tôi có thể hỗ trợ bạn:\n- Giải đáp câu hỏi và tóm tắt kiến thức bài học\n- Hướng dẫn nộp bài tập, tra cứu điểm số và phản hồi\n- Gợi ý cấu trúc giải thuật, cú pháp lập trình và thiết kế hệ thống\n\nBạn cần tôi hỗ trợ chủ đề gì hôm nay?`
  }

  // Không khớp câu hỏi nào ở chế độ chung - nói thật thay vì bịa câu trả lời
  return `Tôi chưa thể trả lời chính xác câu hỏi này ở chế độ hỗ trợ chung.\n\nHãy mở một **lớp học cụ thể** rồi hỏi lại - lúc đó tôi sẽ trả lời dựa trên đúng tài liệu và bài đăng của lớp đó thay vì chỉ hướng dẫn thao tác chung.`
}

function formatChatTime(date) {
  return new Date(date).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AIChatbotWidget() {
  const { user } = useAuth()
  const location = useLocation()
  const classId = useMemo(() => getClassIdFromPath(location.pathname), [location.pathname])

  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)

  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: `Xin chào ${user?.full_name || 'bạn'}! 👋 Tôi là **Trợ lý AI Học tập**. Tôi có thể giúp bạn giải đáp kiến thức, hướng dẫn làm bài tập hoặc tra cứu thông tin lớp học.`,
      timestamp: new Date().toISOString(),
    },
  ])

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, messages, isTyping])

  // Nhắc người dùng đổi chế độ khi họ điều hướng vào/ra khỏi một lớp học cụ thể
  const prevClassIdRef = useRef(classId)
  useEffect(() => {
    if (prevClassIdRef.current === classId) return
    prevClassIdRef.current = classId
    if (!isOpen) return

    const text = classId
      ? 'Bạn đang ở trong một lớp học - từ giờ tôi sẽ trả lời dựa trên tài liệu và bài đăng của lớp này.'
      : 'Bạn đã rời khỏi trang lớp học - tôi tạm chuyển về chế độ hỗ trợ chung (không còn đọc tài liệu lớp học).'
    setMessages((prev) => [
      ...prev,
      { id: `mode-${Date.now()}`, sender: 'ai', text, timestamp: new Date().toISOString() },
    ])
  }, [classId, isOpen])

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim()
    if (!text || isTyping) return

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputMessage('')
    setIsTyping(true)

    try {
      const aiReplyText = classId
        ? await aiChatService.sendMessage(classId, text)
        : getGeneralHelpResponse(text, user?.full_name || 'bạn')

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReplyText || 'Xin lỗi, tôi chưa có câu trả lời cho việc này.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-error-${Date.now()}`,
          sender: 'ai',
          text: err.message || 'Đã có lỗi xảy ra, vui lòng thử lại sau.',
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: `Đã làm mới cuộc hội thoại. Bạn cần hỗ trợ gì tiếp theo?`,
        timestamp: new Date().toISOString(),
      },
    ])
  }

  const handleCopyMessage = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* ── Chat Window Popup ── */}
      {isOpen && (
        <div
          className={`mb-3 flex flex-col rounded-3xl border border-indigo-200/80 bg-background/95 backdrop-blur-md shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 ${
            isExpanded
              ? 'w-[92vw] sm:w-[540px] h-[650px] max-h-[85vh]'
              : 'w-[92vw] sm:w-[390px] h-[520px] max-h-[75vh]'
          }`}
          role="dialog"
          aria-label="AI Chatbot Assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-4 py-3.5 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex size-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white shadow-inner">
                  <Bot className="size-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-indigo-600" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight">AI Trợ lý Học tập</h3>
                  <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-white/80 flex items-center gap-1">
                  <Sparkles className="size-3" />
                  {classId ? 'Đang đọc tài liệu lớp học này' : 'Chế độ hỗ trợ chung'}
                </p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearHistory}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white transition-colors"
                title="Làm mới cuộc trò chuyện"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="hidden sm:inline-flex rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white transition-colors"
                title={isExpanded ? 'Thu nhỏ' : 'Phóng to'}
              >
                {isExpanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white transition-colors"
                title="Đóng khung chat"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg, index) => {
              const isAi = msg.sender === 'ai'
              return (
                <div
                  key={msg.id || index}
                  className={`flex items-start gap-2.5 ${isAi ? '' : 'flex-row-reverse'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex size-7 items-center justify-center rounded-xl shrink-0 text-white font-bold shadow-xs ${
                      isAi
                        ? 'bg-gradient-to-tr from-indigo-600 to-violet-500'
                        : 'bg-emerald-600'
                    }`}
                  >
                    {isAi ? <Bot className="size-4" /> : <User className="size-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`group relative max-w-[82%] space-y-1`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-xs ${
                        isAi
                          ? 'bg-muted/40 border border-border/80 text-foreground whitespace-pre-line'
                          : 'bg-indigo-600 text-white rounded-tr-xs'
                      }`}
                    >
                      {msg.text}
                    </div>

                    <div
                      className={`flex items-center gap-2 px-1 text-[10px] text-muted-foreground ${
                        isAi ? '' : 'justify-end'
                      }`}
                    >
                      <span>{formatChatTime(msg.timestamp)}</span>
                      {isAi && (
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.text, index)}
                          className="opacity-0 group-hover:opacity-100 hover:text-indigo-600 transition-all flex items-center gap-0.5"
                          title="Sao chép"
                        >
                          {copiedIndex === index ? (
                            <Check className="size-2.5 text-emerald-600" />
                          ) : (
                            <Copy className="size-2.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* AI Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-xs">
                  <Bot className="size-4" />
                </div>
                <div className="rounded-2xl rounded-tl-xs border border-border/70 bg-muted/40 px-3.5 py-2.5 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-indigo-600 animate-bounce" />
                    <span className="size-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="size-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Prompt Chips (Only shown when not typing) */}
          {!isTyping && messages.length <= 3 && (
            <div className="px-3 py-1.5 border-t border-border/40 bg-muted/15 flex flex-wrap gap-1.5">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors truncate max-w-[260px]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 border-t border-border/60 bg-card rounded-b-3xl">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi AI bất kỳ điều gì..."
                  className="w-full rounded-2xl border border-input bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-2"
                />
              </div>

              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="flex size-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shrink-0"
                title="Gửi tin nhắn"
              >
                {isTyping ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Floating Action Button (FAB) ── */}
      <button
        type="button"
        id="open-ai-chatbot-btn"
        onClick={() => setIsOpen((v) => !v)}
        className="group relative flex size-13 sm:size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-600/30 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-600/40 active:scale-95 transition-all duration-200"
        title="Trợ lý AI Học tập"
        aria-label="Mở Trợ lý AI"
      >
        {/* Pulsing ring indicator */}
        <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 opacity-40 blur-sm group-hover:opacity-75 animate-pulse transition duration-200 pointer-events-none" />

        <div className="relative flex items-center justify-center">
          {isOpen ? (
            <X className="size-6 transition-transform group-hover:rotate-90 duration-200" />
          ) : (
            <>
              <Bot className="size-6" />
              <span className="absolute -top-2 -right-2 flex size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-3 bg-emerald-500" />
              </span>
            </>
          )}
        </div>
      </button>
    </div>
  )
}

export default AIChatbotWidget
