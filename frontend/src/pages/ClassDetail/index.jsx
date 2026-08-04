import { useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  Clock,
  Crown,
  FileText,
  GraduationCap,
  Image,
  Key,
  MoreVertical,
  Paperclip,
  Pin,
  Send,
  Star,
  Users,
  Video,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CLASS_INFO = {
  id: 1,
  title: 'Frontend Foundations',
  subject: 'Lập trình Web',
  description:
    'Khóa học lập trình web hiện đại với React, HTML, CSS và JavaScript. Học viên sẽ được thực hành qua các dự án thực tế.',
  join_code: 'FRONT88',
  teacher: 'Nguyễn Minh Khoa',
  student_count: 28,
  banner_color: 'from-indigo-600 via-indigo-500 to-violet-600',
}

const POSTS = [
  {
    id: 1,
    author: 'Nguyễn Minh Khoa',
    avatar: 'NMK',
    role: 'teacher',
    time: '2 giờ trước',
    content:
      'Chào cả lớp! 👋 Tuần này chúng ta sẽ bắt đầu học về React Hooks. Hãy xem trước tài liệu và chuẩn bị câu hỏi nhé. Buổi học trực tuyến vào thứ 4 lúc 19h30.',
    attachments: [],
    comments: [
      { id: 1, author: 'Trần Thu Hà', avatar: 'TTH', time: '1 giờ trước', text: 'Em đã đọc rồi ạ! Rất thú vị 🎉' },
      { id: 2, author: 'Lê Văn Bình', avatar: 'LVB', time: '45 phút trước', text: 'Thầy ơi, slide bài giảng upload ở đâu ạ?' },
    ],
    pinned: true,
  },
  {
    id: 2,
    author: 'Nguyễn Minh Khoa',
    avatar: 'NMK',
    role: 'teacher',
    time: 'Hôm qua',
    content:
      '📌 Nhắc nhở: Bài tập "Build a Landing Page" hạn nộp vào ngày mai 23:59. Các em nhớ submit qua form nhé!',
    attachments: [{ name: 'assignment_guidelines.pdf', type: 'pdf' }],
    comments: [
      { id: 3, author: 'Phạm Anh Tuấn', avatar: 'PAT', time: '12 giờ trước', text: 'Dạ em nộp rồi ạ thầy!' },
    ],
    pinned: false,
  },
  {
    id: 3,
    author: 'Trần Thu Hà',
    avatar: 'TTH',
    role: 'student',
    time: '3 ngày trước',
    content: 'Mọi người ơi, có ai hiểu phần useEffect chưa? Em bị lỗi khi fetch API, thầy giúp em với ạ 🙏',
    attachments: [],
    comments: [
      { id: 4, author: 'Nguyễn Minh Khoa', avatar: 'NMK', time: '3 ngày trước', text: 'Em gửi code lên đây thầy xem nhé!' },
    ],
    pinned: false,
  },
]

const ASSIGNMENTS = [
  {
    id: 1,
    title: 'Build a Landing Page',
    description: 'Tạo một landing page responsive cho sản phẩm giả định bằng HTML & CSS thuần.',
    due: 'Ngày mai, 23:59',
    due_status: 'urgent',
    points: 100,
    submitted: false,
    attachments: 2,
  },
  {
    id: 2,
    title: 'React Component Library',
    description: 'Xây dựng thư viện component cơ bản với Button, Input, Card và Modal.',
    due: '15/08/2025',
    due_status: 'upcoming',
    points: 150,
    submitted: true,
    attachments: 1,
  },
  {
    id: 3,
    title: 'JavaScript Fundamentals Quiz',
    description: 'Bài kiểm tra kiến thức JS: closures, prototype, async/await.',
    due: '10/08/2025',
    due_status: 'past',
    points: 50,
    submitted: true,
    attachments: 0,
  },
]

const MEMBERS = {
  teacher: [
    { id: 1, name: 'Nguyễn Minh Khoa', email: 'nmikhoa@edu.vn', avatar: 'NMK' },
  ],
  students: [
    { id: 2, name: 'Trần Thu Hà', email: 'ttha@student.edu.vn', avatar: 'TTH', progress: 72 },
    { id: 3, name: 'Lê Văn Bình', avatar: 'LVB', email: 'lvbinh@student.edu.vn', progress: 55 },
    { id: 4, name: 'Phạm Anh Tuấn', avatar: 'PAT', email: 'patuan@student.edu.vn', progress: 90 },
    { id: 5, name: 'Nguyễn Quỳnh Anh', avatar: 'NQA', email: 'nqanh@student.edu.vn', progress: 40 },
    { id: 6, name: 'Hoàng Đức Minh', avatar: 'HDM', email: 'hdminh@student.edu.vn', progress: 68 },
    { id: 7, name: 'Vũ Thị Lan', avatar: 'VTL', email: 'vtlan@student.edu.vn', progress: 83 },
    { id: 8, name: 'Đặng Quốc Huy', avatar: 'DQH', email: 'dqhuy@student.edu.vn', progress: 61 },
    { id: 9, name: 'Bùi Thị Mai', avatar: 'BTM', email: 'btmai@student.edu.vn', progress: 77 },
  ],
}

// ─── Avatar Component ─────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-teal-500',
]
function getAvatarColor(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function Avatar({ initials, size = 'md', ring = false }) {
  const sizeClass = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-12 text-base' }[size]
  return (
    <div
      className={`${sizeClass} ${getAvatarColor(initials)} ${ring ? 'ring-2 ring-white ring-offset-1' : ''} rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm`}
    >
      {initials}
    </div>
  )
}

// ─── Tab: Bảng tin ────────────────────────────────────────────────────────────
function BangTinTab() {
  const [newPost, setNewPost] = useState('')
  const [posts, setPosts] = useState(POSTS)
  const [expandedComments, setExpandedComments] = useState({})
  const [commentInputs, setCommentInputs] = useState({})

  const toggleComments = (postId) =>
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }))

  const handleAddComment = (postId) => {
    const text = commentInputs[postId]?.trim()
    if (!text) return
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                { id: Date.now(), author: 'Bạn', avatar: 'BN', time: 'Vừa xong', text },
              ],
            }
          : p
      )
    )
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }))
  }

  const handlePost = () => {
    if (!newPost.trim()) return
    setPosts((prev) => [
      {
        id: Date.now(),
        author: 'Bạn',
        avatar: 'BN',
        role: 'student',
        time: 'Vừa xong',
        content: newPost,
        attachments: [],
        comments: [],
        pinned: false,
      },
      ...prev,
    ])
    setNewPost('')
  }

  return (
    <div className="space-y-5">
      {/* Post Composer */}
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <Avatar initials="BN" />
          <div className="flex-1 space-y-3">
            <textarea
              rows={3}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Thông báo gì đó với cả lớp..."
              className="w-full resize-none rounded-xl border border-input bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Đính kèm tệp"
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-indigo-600 transition-colors"
                >
                  <Paperclip className="size-4" />
                </button>
                <button
                  type="button"
                  title="Thêm hình ảnh"
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-indigo-600 transition-colors"
                >
                  <Image className="size-4" />
                </button>
                <button
                  type="button"
                  title="Video"
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-indigo-600 transition-colors"
                >
                  <Video className="size-4" />
                </button>
              </div>
              <Button
                onClick={handlePost}
                disabled={!newPost.trim()}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs shadow-indigo-600/30 gap-2 disabled:opacity-40"
              >
                <Send className="size-3.5" />
                Đăng
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts List */}
      {posts.map((post) => (
        <article
          key={post.id}
          className={`rounded-2xl border bg-card shadow-xs transition-all hover:shadow-md ${post.pinned ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-border/70'}`}
        >
          {post.pinned && (
            <div className="flex items-center gap-1.5 rounded-t-2xl bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 border-b border-indigo-100">
              <Pin className="size-3 fill-indigo-600 text-indigo-600" />
              Đã ghim
            </div>
          )}

          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar initials={post.avatar} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{post.author}</span>
                    {post.role === 'teacher' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                        <Crown className="size-2.5" />
                        GV
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{post.time}</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <MoreVertical className="size-4" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-foreground whitespace-pre-line">{post.content}</p>

            {post.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {post.attachments.map((att) => (
                  <div
                    key={att.name}
                    className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 text-sm hover:bg-muted/70 transition-colors cursor-pointer"
                  >
                    <FileText className="size-4 text-indigo-600 shrink-0" />
                    <span className="font-medium text-foreground">{att.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Comments */}
            <div className="mt-4 border-t border-border/50 pt-3">
              <button
                type="button"
                onClick={() => toggleComments(post.id)}
                className="text-xs font-medium text-muted-foreground hover:text-indigo-600 transition-colors"
              >
                {post.comments.length} bình luận
                {expandedComments[post.id] ? ' ▲' : ' ▼'}
              </button>

              {expandedComments[post.id] && (
                <div className="mt-3 space-y-3">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2.5">
                      <Avatar initials={comment.avatar} size="sm" />
                      <div className="flex-1 rounded-xl bg-muted/50 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{comment.author}</span>
                          <span className="text-[11px] text-muted-foreground">{comment.time}</span>
                        </div>
                        <p className="text-xs text-foreground mt-0.5">{comment.text}</p>
                      </div>
                    </div>
                  ))}

                  {/* Comment Input */}
                  <div className="flex items-center gap-2.5 mt-2">
                    <Avatar initials="BN" size="sm" />
                    <div className="flex-1 flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-1.5">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        placeholder="Thêm bình luận..."
                        className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(post.id)}
                        className="text-muted-foreground hover:text-indigo-600 transition-colors"
                      >
                        <Send className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

// ─── Tab: Bài tập ─────────────────────────────────────────────────────────────
function BaiTapTab() {
  const STATUS_CONFIG = {
    urgent: { label: 'Gấp!', cls: 'bg-red-100 text-red-700 border-red-200' },
    upcoming: { label: 'Sắp tới', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    past: { label: 'Đã qua', cls: 'bg-muted text-muted-foreground border-border' },
  }

  const submitted = ASSIGNMENTS.filter((a) => a.submitted).length
  const total = ASSIGNMENTS.length

  return (
    <div className="space-y-5">
      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/70 bg-card p-4 text-center shadow-xs">
          <p className="text-2xl font-bold text-foreground">{total}</p>
          <p className="text-xs text-muted-foreground mt-1">Tổng bài tập</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center shadow-xs">
          <p className="text-2xl font-bold text-emerald-700">{submitted}</p>
          <p className="text-xs text-emerald-700/70 mt-1">Đã nộp</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center shadow-xs">
          <p className="text-2xl font-bold text-amber-700">{total - submitted}</p>
          <p className="text-xs text-amber-700/70 mt-1">Chưa nộp</p>
        </div>
      </div>

      {/* Assignment List */}
      <div className="space-y-3">
        {ASSIGNMENTS.map((assignment) => {
          const status = STATUS_CONFIG[assignment.due_status]
          return (
            <article
              key={assignment.id}
              className="group rounded-2xl border border-border/70 bg-card p-5 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl shadow-xs ${
                    assignment.submitted
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {assignment.submitted ? (
                    <CheckSquare className="size-5" />
                  ) : (
                    <ClipboardList className="size-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground group-hover:text-indigo-700 transition-colors">
                      {assignment.title}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${status.cls}`}
                    >
                      {status.label}
                    </span>
                    {assignment.submitted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <CheckSquare className="size-3" />
                        Đã nộp
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                    {assignment.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-indigo-500" />
                      Hạn nộp: <strong className="text-foreground">{assignment.due}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Star className="size-3.5 text-amber-500" />
                      <strong className="text-foreground">{assignment.points}</strong> điểm
                    </span>
                    {assignment.attachments > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Paperclip className="size-3.5" />
                        {assignment.attachments} tệp đính kèm
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="size-4 text-muted-foreground group-hover:text-indigo-600 shrink-0 mt-1 transition-colors" />
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab: Mọi người ───────────────────────────────────────────────────────────
function MoiNguoiTab() {
  const [search, setSearch] = useState('')
  const filtered = MEMBERS.students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Teacher Section */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Giáo viên
        </h3>
        <div className="space-y-2">
          {MEMBERS.teacher.map((teacher) => (
            <div
              key={teacher.id}
              className="flex items-center gap-3.5 rounded-2xl border border-border/70 bg-card p-4 shadow-xs"
            >
              <div className="relative">
                <Avatar initials={teacher.avatar} size="lg" />
                <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-indigo-600 ring-2 ring-white">
                  <Crown className="size-3 text-white" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{teacher.name}</p>
                <p className="text-xs text-muted-foreground truncate">{teacher.email}</p>
              </div>
              <span className="rounded-full bg-indigo-100 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700">
                Giáo viên
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Students Section */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Học viên ({filtered.length})
          </h3>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm học viên..."
            className="rounded-xl border border-input bg-background px-3 py-1.5 text-sm w-48 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 py-10 text-center">
            <Users className="mx-auto size-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">Không tìm thấy học viên</p>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {filtered.map((student) => (
              <div
                key={student.id}
                className="group flex items-center gap-3.5 rounded-2xl border border-border/70 bg-card p-4 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <Avatar initials={student.avatar} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{student.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  {/* Progress bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          student.progress >= 80
                            ? 'bg-emerald-500'
                            : student.progress >= 50
                              ? 'bg-indigo-500'
                              : 'bg-amber-400'
                        }`}
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground w-8 text-right">
                      {student.progress}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ClassDetailPage ─────────────────────────────────────────────────────
const TABS = [
  { id: 'bangtin', label: 'Bảng tin', icon: BookOpen },
  { id: 'baitap', label: 'Bài tập', icon: ClipboardList },
  { id: 'moinguoi', label: 'Mọi người', icon: Users },
]

export function ClassDetailPage() {
  const [activeTab, setActiveTab] = useState('bangtin')
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Banner ── */}
      <div className={`relative bg-gradient-to-r ${CLASS_INFO.banner_color} overflow-hidden`}>
        {/* Decorative background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 size-64 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-16 -left-16 size-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-4 left-1/2 size-40 rounded-full bg-white/5 blur-xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 pt-6 pb-8">
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div>
              {/* Subject badge */}
              <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white border border-white/20 mb-3">
                <BookOpen className="mr-1.5 size-3" />
                {CLASS_INFO.subject}
              </span>

              <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
                {CLASS_INFO.title}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/75 leading-relaxed">
                {CLASS_INFO.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="size-4" />
                  {CLASS_INFO.teacher}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="size-4" />
                  {CLASS_INFO.student_count} học viên
                </span>
              </div>
            </div>

            {/* Join Code */}
            <div className="shrink-0 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-5 py-3.5 text-white shadow-lg">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/70 mb-1">
                <Key className="size-3.5" />
                Mã lớp
              </div>
              <p className="text-2xl font-mono font-extrabold tracking-widest">
                {CLASS_INFO.join_code}
              </p>
            </div>
          </div>
        </div>

        {/* Tab bar inside banner */}
        <div className="relative mx-auto max-w-5xl px-6">
          <div className="flex items-center gap-1 border-b border-white/20">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-white'
                    : 'text-white/60 hover:text-white/90'
                }`}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="mx-auto max-w-5xl px-6 py-7">
        {activeTab === 'bangtin' && <BangTinTab />}
        {activeTab === 'baitap' && <BaiTapTab />}
        {activeTab === 'moinguoi' && <MoiNguoiTab />}
      </div>
    </div>
  )
}
