import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  Clock,
  Crown,
  Download,
  ExternalLink,
  GraduationCap,
  Key,
  Loader2,
  Paperclip,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  Users,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AssignmentEditorModal } from '@/components/classes/AssignmentEditorModal'
import { StudentAssignmentDetailModal } from '@/components/classes/StudentAssignmentDetailModal'
import { assignmentService } from '@/services/assignmentService'
import { classService } from '@/services/classService'
import { postService } from '@/services/postService'
import { useAuth } from '@/context/useAuth'

// ─── Default banner color ─────────────────────────────────────────────────────
const DEFAULT_BANNER_COLOR = 'from-indigo-600 via-indigo-500 to-violet-600'

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

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

function formatPostTime(isoString) {
  try {
    return new Date(isoString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

function countComments(comments) {
  return (comments || []).reduce((sum, c) => sum + 1 + countComments(c.replies), 0)
}

// Chèn 1 reply mới vào đúng comment cha trong cây bình luận (immutable)
function insertReplyIntoTree(comments, parentId, reply) {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return { ...comment, replies: [...(comment.replies || []), reply] }
    }
    if (comment.replies?.length) {
      return { ...comment, replies: insertReplyIntoTree(comment.replies, parentId, reply) }
    }
    return comment
  })
}

function Avatar({ initials, size = 'md' }) {
  const sizeClass = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-12 text-base' }[size]
  return (
    <div
      className={`${sizeClass} ${getAvatarColor(initials)} rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm`}
    >
      {initials}
    </div>
  )
}

// ─── Bình luận (đệ quy cho phần trả lời) ──────────────────────────────────────
function CommentItem({ comment, postId, onReplySubmit, depth = 0 }) {
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmitReply = async () => {
    const text = replyText.trim()
    if (!text) return
    setSubmitting(true)
    setError('')
    try {
      await onReplySubmit(postId, text, comment.id)
      setReplyText('')
      setShowReplyBox(false)
    } catch (err) {
      setError(err.message || 'Không thể gửi trả lời.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={depth > 0 ? 'ml-8' : ''}>
      <div className="flex items-start gap-2.5">
        <Avatar initials={getInitials(comment.author?.full_name)} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="rounded-xl bg-muted/50 px-3 py-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold">{comment.author?.full_name}</span>
              {comment.author_role === 'INSTRUCTOR' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                  <Crown className="size-2.5" />
                  GV
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">{formatPostTime(comment.created_at)}</span>
            </div>
            <p className="text-xs text-foreground mt-0.5 whitespace-pre-line">{comment.content}</p>
          </div>

          <button
            type="button"
            onClick={() => setShowReplyBox((v) => !v)}
            className="mt-1 text-[11px] font-semibold text-muted-foreground hover:text-indigo-600 transition-colors"
          >
            Trả lời
          </button>

          {error && <p className="mt-1 text-[11px] font-medium text-destructive">{error}</p>}

          {showReplyBox && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-1.5">
                <input
                  type="text"
                  autoFocus
                  disabled={submitting}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply()}
                  placeholder={`Trả lời ${comment.author?.full_name || ''}...`}
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSubmitReply}
                  disabled={submitting || !replyText.trim()}
                  className="text-muted-foreground hover:text-indigo-600 transition-colors disabled:opacity-40"
                >
                  {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                </button>
              </div>
            </div>
          )}

          {comment.replies?.length > 0 && (
            <div className="mt-2 space-y-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onReplySubmit={onReplySubmit}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Bảng tin ────────────────────────────────────────────────────────────
function BangTinTab({ classId, canPost, currentUser }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newPost, setNewPost] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [posting, setPosting] = useState(false)
  const [expandedComments, setExpandedComments] = useState({})
  const [commentInputs, setCommentInputs] = useState({})
  const [commentSubmitting, setCommentSubmitting] = useState({})

  useEffect(() => {
    let ignore = false

    async function loadPosts() {
      if (!classId) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const data = await postService.getClassPosts(classId)
        if (!ignore) {
          setPosts(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Không thể tải bảng tin lớp học.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadPosts()
    return () => {
      ignore = true
    }
  }, [classId])

  const handlePost = async () => {
    const content = newPost.trim()
    if (!content && selectedFiles.length === 0) return

    setPosting(true)
    setError('')
    try {
      const created = await postService.createPost(classId, content, selectedFiles)
      setPosts((prev) => [created, ...prev])
      setNewPost('')
      setSelectedFiles([])
    } catch (err) {
      setError(err.message || 'Không thể đăng thông báo. Vui lòng thử lại.')
    } finally {
      setPosting(false)
    }
  }

  const toggleComments = (postId) =>
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }))

  const handleAddComment = async (postId) => {
    const text = commentInputs[postId]?.trim()
    if (!text) return

    setCommentSubmitting((prev) => ({ ...prev, [postId]: true }))
    setError('')
    try {
      const created = await postService.createComment(postId, text, null)
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, created] } : p))
      )
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }))
      setExpandedComments((prev) => ({ ...prev, [postId]: true }))
    } catch (err) {
      setError(err.message || 'Không thể gửi bình luận. Vui lòng thử lại.')
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }))
    }
  }

  const handleReply = async (postId, text, parentId) => {
    const created = await postService.createComment(postId, text, parentId)
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: insertReplyIntoTree(p.comments, parentId, created) } : p
      )
    )
    setExpandedComments((prev) => ({ ...prev, [postId]: true }))
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive">
          {error}
        </div>
      )}

      {/* ── Post Composer (chỉ giảng viên của lớp) ── */}
      {canPost && (
        <div className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <Avatar initials={getInitials(currentUser?.full_name)} />
              <div className="flex-1 space-y-3">
                <textarea
                  rows={3}
                  disabled={posting}
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Thông báo gì đó với cả lớp..."
                  className="w-full resize-none rounded-xl border border-input bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 bg-muted/5 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-indigo-600 transition-colors px-2 py-1.5 rounded-md hover:bg-indigo-50">
                <Paperclip className="size-4" />
                Đính kèm
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files)])
                    }
                  }}
                  disabled={posting}
                />
              </label>
            </div>
            
            <Button
              onClick={handlePost}
              disabled={(!newPost.trim() && selectedFiles.length === 0) || posting}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs shadow-indigo-600/30 gap-2 disabled:opacity-40"
            >
              {posting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Đăng
            </Button>
          </div>
          {/* Danh sách file đã chọn */}
          {selectedFiles.length > 0 && (
            <div className="border-t border-border/50 bg-muted/5 px-4 py-2.5">
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs">
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span className="truncate max-w-[150px] font-medium" title={file.name}>{file.name}</span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                      disabled={posting}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Posts List ── */}
      {loading && (
        <div className="rounded-2xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
          Đang tải bảng tin...
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
          Chưa có thông báo nào trong lớp học này.
        </div>
      )}

      {posts.map((post) => (
        <article
          key={post.id}
          className="rounded-2xl border border-border/70 bg-card shadow-xs transition-all hover:shadow-md"
        >
          <div className="p-5">
            <div className="flex items-center gap-3">
              <Avatar initials={getInitials(post.author?.full_name)} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{post.author?.full_name}</span>
                  {post.author_role === 'INSTRUCTOR' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                      <Crown className="size-2.5" />
                      GV
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{formatPostTime(post.created_at)}</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-foreground whitespace-pre-line">{post.content}</p>

            {/* Attachments */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-md border bg-muted/30 px-3 py-1.5 text-xs hover:bg-muted/50 hover:border-border transition-all"
                  >
                    <FileText className="size-4 text-indigo-500" />
                    <span className="font-medium text-foreground truncate max-w-[200px]" title={att.file_name || 'Tệp đính kèm'}>
                      {att.file_name || 'Tệp đính kèm'}
                    </span>
                  </a>
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
                {countComments(post.comments)} bình luận
                {expandedComments[post.id] ? ' ▲' : ' ▼'}
              </button>

              {expandedComments[post.id] && (
                <div className="mt-3 space-y-3">
                  {post.comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      postId={post.id}
                      onReplySubmit={handleReply}
                    />
                  ))}

                  {/* Comment Input */}
                  <div className="flex items-center gap-2.5 mt-2">
                    <Avatar initials={getInitials(currentUser?.full_name)} size="sm" />
                    <div className="flex-1 flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-1.5">
                      <input
                        type="text"
                        disabled={commentSubmitting[post.id]}
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
                        disabled={commentSubmitting[post.id] || !commentInputs[post.id]?.trim()}
                        className="text-muted-foreground hover:text-indigo-600 transition-colors disabled:opacity-40"
                      >
                        {commentSubmitting[post.id] ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Send className="size-3.5" />
                        )}
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
function formatAssignmentDueDate(isoString) {
  try {
    return new Date(isoString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

function getAssignmentDueStatus(isoString) {
  try {
    const due = new Date(isoString)
    const now = new Date()
    const diffMs = due - now
    if (diffMs < 0) {
      return { status: 'overdue', label: 'Đã hết hạn', colorClass: 'bg-rose-500/10 text-rose-600 border-rose-200' }
    }
    const diffHours = diffMs / (1000 * 60 * 60)
    if (diffHours <= 24) {
      return { status: 'soon', label: 'Sắp hết hạn (dưới 24h)', colorClass: 'bg-amber-500/10 text-amber-700 border-amber-200' }
    }
    return { status: 'active', label: 'Đang mở', colorClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' }
  } catch {
    return { status: 'unknown', label: 'Đang mở', colorClass: 'bg-muted text-muted-foreground border-border' }
  }
}

function BaiTapTab({ classId, classTitle, canManage, currentUser }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAssignmentForDetail, setSelectedAssignmentForDetail] = useState(null)
  const [search, setSearch] = useState('')

  const loadAssignments = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await assignmentService.getClassAssignments(classId)
      setAssignments(data || [])
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách bài tập.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssignments()
  }, [classId])

  const handleCreateSuccess = (newAssignment) => {
    setAssignments((prev) => [newAssignment, ...prev])
  }

  const filteredAssignments = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.description && a.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Danh sách bài tập</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý đề bài, cấu hình hạn nộp và theo dõi tiến độ nộp bài.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm bài tập..."
              className="rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-xs w-48 sm:w-60 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {canManage && (
            <Button
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 text-xs font-semibold px-4 py-2"
            >
              <Plus className="mr-1.5 size-4" />
              Tạo bài tập mới
            </Button>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          {error}
        </div>
      )}

      {/* Assignments List */}
      {loading ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
          <Loader2 className="size-6 animate-spin text-indigo-500" />
          <span>Đang tải danh sách bài tập...</span>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card py-16 text-center shadow-xs">
          <div className="flex size-14 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/50">
            <ClipboardList className="size-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="font-bold text-foreground text-base">
              {search ? 'Không tìm thấy bài tập phù hợp' : 'Chưa có bài tập nào trong lớp này'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              {canManage
                ? 'Hãy bắt đầu soạn thảo đề bài đầu tiên để giao bài tập cho học viên.'
                : 'Bài tập do giảng viên giao sẽ xuất hiện tại đây.'}
            </p>
          </div>
          {canManage && !search && (
            <Button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 text-xs font-semibold"
            >
              <Plus className="mr-1.5 size-4" />
              Soạn đề bài ngay
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAssignments.map((assignment) => {
            const dueInfo = getAssignmentDueStatus(assignment.due_date)
            return (
              <article
                key={assignment.id}
                className="group relative rounded-2xl border border-border/80 bg-card p-5 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <div className="flex flex-col gap-3">
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 group-hover:scale-105 transition-transform">
                        <ClipboardList className="size-5" />
                      </div>
                      <div>
                        <h3
                          onClick={() => setSelectedAssignmentForDetail(assignment)}
                          className="text-base font-bold text-foreground group-hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          {assignment.title}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5" />
                            Hạn nộp: <strong className="text-foreground">{formatAssignmentDueDate(assignment.due_date)}</strong>
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                            <Award className="size-3.5" />
                            Thang điểm: {assignment.max_score} điểm
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge & Action Button */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${dueInfo.colorClass}`}
                      >
                        {dueInfo.status === 'overdue' ? (
                          <AlertTriangle className="size-3.5" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        {dueInfo.label}
                      </span>

                      {canManage ? (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAssignmentForDetail(assignment)}
                            className="rounded-xl text-xs font-semibold px-2.5 py-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                          >
                            Xem đề bài
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/teacher/class/${classId}/assignments/${assignment.id}/grading`
                              )
                            }
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 shadow-xs"
                          >
                            <Award className="mr-1 size-3.5" />
                            Chấm bài
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setSelectedAssignmentForDetail(assignment)}
                          className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs text-xs font-semibold px-3 py-1.5"
                        >
                          Xem đề & Nộp bài
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {assignment.description && (
                    <div className="mt-1 rounded-xl bg-muted/30 p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-line">
                      {assignment.description}
                    </div>
                  )}

                  {/* Attachment File */}
                  {assignment.file_url && (
                    <div className="mt-1 flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="size-4 text-indigo-600 shrink-0" />
                        <span className="text-xs font-medium text-foreground truncate">
                          Tệp đề bài đính kèm
                        </span>
                      </div>
                      <a
                        href={assignment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-colors"
                      >
                        <Download className="size-3.5" />
                        Tải đề bài
                      </a>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Assignment Editor Modal (Giảng viên) */}
      <AssignmentEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateSuccess}
        initialClassId={classId}
        initialClassName={classTitle}
      />

      {/* Student Assignment Detail & Submission Modal (Sinh viên / Giảng viên) */}
      <StudentAssignmentDetailModal
        isOpen={!!selectedAssignmentForDetail}
        onClose={() => setSelectedAssignmentForDetail(null)}
        assignment={selectedAssignmentForDetail}
        isInstructor={canManage}
      />
    </div>
  )
}

// ─── Tab: Mọi người ───────────────────────────────────────────────────────────
function MoiNguoiTab({ classInfo }) {
  const [search, setSearch] = useState('')
  const students = []
  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  )

  const teacherInitials = (classInfo?.teacher || 'GV')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  return (
    <div className="space-y-6">
      {/* Teacher Section */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Giáo viên
        </h3>
        <div className="space-y-2">
          {[{ id: 'instructor', name: classInfo?.teacher || 'Giảng viên', email: '' }].map((teacher) => (
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
  const [classInfo, setClassInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()

  useEffect(() => {
    let ignore = false

    async function loadClassDetail() {
      if (!id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const data = await classService.getClassById(id)
        if (!ignore && data) {
          setClassInfo({
            id: data.id,
            title: data.title,
            subject: data.subject || 'Lớp học',
            description: data.description || 'Không có mô tả cho lớp học này.',
            join_code: data.join_code,
            teacher: data.instructor?.full_name || user?.full_name || 'Giảng viên',
            instructor_id: data.instructor_id ?? data.instructor?.id ?? null,
            student_count: data.student_count ?? 0,
            banner_color: DEFAULT_BANNER_COLOR,
          })
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Không thể tải thông tin lớp học.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadClassDetail()
    return () => {
      ignore = true
    }
  }, [id, user?.full_name])

  const canPost =
    !loading &&
    !!user &&
    (user.role === 'ADMIN' || (user.role === 'INSTRUCTOR' && classInfo?.instructor_id === user.id))

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Banner ── */}
      <div className={`relative bg-gradient-to-r ${classInfo?.banner_color ?? DEFAULT_BANNER_COLOR} overflow-hidden`}>
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
                {loading ? 'Đang tải...' : classInfo?.subject}
              </span>

              <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
                {loading ? 'Đang tải lớp học...' : classInfo?.title}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/75 leading-relaxed">
                {error || classInfo?.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="size-4" />
                  {classInfo?.teacher}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="size-4" />
                  {classInfo?.student_count ?? 0} học viên
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
                {classInfo?.join_code || '-'}
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
        {activeTab === 'bangtin' && (
          <BangTinTab classId={id} canPost={canPost} currentUser={user} />
        )}
        {activeTab === 'baitap' && (
          <BaiTapTab
            classId={id}
            classTitle={classInfo?.title || ''}
            canManage={canPost}
            currentUser={user}
          />
        )}
        {activeTab === 'moinguoi' && <MoiNguoiTab classInfo={classInfo} />}
      </div>
    </div>
  )
}
