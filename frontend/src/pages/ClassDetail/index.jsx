import { useEffect, useRef, useState } from 'react'
import {
  Archive,
  ArrowLeft,
  BookOpen,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  Clock,
  Crown,
  Download,
  Eye,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  GraduationCap,
  Image,
  Key,
  MoreVertical,
  Paperclip,
  Pin,
  Send,
  Star,
  Upload,
  Users,
  Video,
  X,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { classService } from '@/services/classService'
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

// ─── File type helpers ────────────────────────────────────────────────────────
function getFileCategory(file) {
  const type = file.type || ''
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('video/')) return 'video'
  if (type.startsWith('audio/')) return 'audio'
  if (type === 'application/pdf' || type.includes('word') || type.includes('document')) return 'doc'
  if (type.includes('zip') || type.includes('rar') || type.includes('compressed')) return 'archive'
  return 'file'
}

function FileTypeIcon({ category, className = 'size-5' }) {
  const icons = {
    image: <FileImage className={`${className} text-emerald-500`} />,
    video: <FileVideo className={`${className} text-violet-500`} />,
    audio: <FileAudio className={`${className} text-amber-500`} />,
    doc:   <FileText  className={`${className} text-blue-500`} />,
    archive: <Archive className={`${className} text-orange-500`} />,
    file:  <FileText  className={`${className} text-indigo-500`} />,
  }
  return icons[category] ?? icons.file
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ─── Attachment preview chip ──────────────────────────────────────────────────
function AttachmentChip({ file, onRemove, preview }) {
  const cat = getFileCategory(file)
  return (
    <div className="group relative flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-sm hover:border-indigo-200 hover:bg-indigo-50/40 transition-all">
      {/* Image thumbnail */}
      {cat === 'image' && preview ? (
        <img
          src={preview}
          alt={file.name}
          className="size-9 rounded-lg object-cover shrink-0 border border-border/50"
        />
      ) : (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background border border-border/50">
          <FileTypeIcon category={cat} className="size-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-foreground max-w-[150px]">{file.name}</p>
        <p className="text-[11px] text-muted-foreground">{formatBytes(file.size)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted/80 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all"
        title="Xóa tệp"
      >
        <X className="size-3" />
      </button>
    </div>
  )
}

// ─── Drop zone ────────────────────────────────────────────────────────────────
function DropZone({ onFiles }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const processFiles = (files) => {
    const arr = Array.from(files)
    if (arr.length) onFiles(arr)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files) }}
      onClick={() => inputRef.current?.click()}
      className={`group cursor-pointer rounded-xl border-2 border-dashed px-5 py-4 text-center transition-all ${
        dragging
          ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
          : 'border-border/50 bg-muted/20 hover:border-indigo-400 hover:bg-indigo-50/30'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => processFiles(e.target.files)}
      />
      <Upload className={`mx-auto mb-1.5 size-5 transition-colors ${
        dragging ? 'text-indigo-600' : 'text-muted-foreground/60 group-hover:text-indigo-500'
      }`} />
      <p className="text-xs font-medium text-muted-foreground">
        {dragging ? 'Thả tệp vào đây…' : 'Kéo & thả hoặc nhấn để chọn tệp'}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground/60">Hình ảnh, video, PDF, và các loại khác</p>
    </div>
  )
}

// ─── Attachment badge (in posted messages) ────────────────────────────────────
function PostAttachment({ att }) {
  const catMap = {
    pdf: 'doc', image: 'image', video: 'video', audio: 'audio', archive: 'archive',
  }
  const cat = catMap[att.type] ?? 'file'
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 text-sm hover:bg-muted/70 transition-colors cursor-pointer group">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/50">
        <FileTypeIcon category={cat} className="size-4" />
      </div>
      <span className="font-medium text-foreground text-xs flex-1 truncate">{att.name}</span>
      <Download className="size-3.5 text-muted-foreground/50 group-hover:text-indigo-600 transition-colors shrink-0" />
    </div>
  )
}

// ─── Tab: Bảng tin ────────────────────────────────────────────────────────────
function BangTinTab() {
  const [newPost, setNewPost] = useState('')
  const [posts, setPosts] = useState([])
  const [expandedComments, setExpandedComments] = useState({})
  const [commentInputs, setCommentInputs] = useState({})
  const [attachedFiles, setAttachedFiles] = useState([])   // { file, preview }
  const [showDropZone, setShowDropZone] = useState(false)

  const addFiles = (files) => {
    const newItems = files.map((file) => {
      const isImage = file.type.startsWith('image/')
      const preview = isImage ? URL.createObjectURL(file) : null
      return { file, preview, id: `${file.name}-${Date.now()}-${Math.random()}` }
    })
    setAttachedFiles((prev) => [...prev, ...newItems])
    setShowDropZone(false)
  }

  const removeFile = (id) => {
    setAttachedFiles((prev) => {
      const item = prev.find((f) => f.id === id)
      if (item?.preview) URL.revokeObjectURL(item.preview)
      return prev.filter((f) => f.id !== id)
    })
  }

  const handleClearAll = () => {
    attachedFiles.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview) })
    setAttachedFiles([])
    setShowDropZone(false)
  }

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
    if (!newPost.trim() && attachedFiles.length === 0) return
    const fileAttachments = attachedFiles.map(({ file }) => ({
      name: file.name,
      type: file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : file.type.startsWith('audio/')
        ? 'audio'
        : file.type.includes('pdf')
        ? 'pdf'
        : 'file',
    }))
    setPosts((prev) => [
      {
        id: Date.now(),
        author: 'Bạn',
        avatar: 'BN',
        role: 'student',
        time: 'Vừa xong',
        content: newPost,
        attachments: fileAttachments,
        comments: [],
        pinned: false,
      },
      ...prev,
    ])
    setNewPost('')
    handleClearAll()
  }

  const canPost = newPost.trim().length > 0 || attachedFiles.length > 0

  return (
    <div className="space-y-5">
      {/* ── Post Composer ── */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
        {/* Top section */}
        <div className="p-4">
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
            </div>
          </div>
        </div>

        {/* ── Attached files preview ── */}
        {attachedFiles.length > 0 && (
          <div className="border-t border-border/50 bg-muted/10 px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {attachedFiles.length} tệp đính kèm
              </span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-muted-foreground hover:text-red-500 transition-colors"
              >
                Xóa tất cả
              </button>
            </div>

            {/* Image grid preview (if any images) */}
            {(() => {
              const imgs = attachedFiles.filter((f) => f.preview)
              const others = attachedFiles.filter((f) => !f.preview)
              return (
                <>
                  {imgs.length > 0 && (
                    <div
                      className={`gap-2 mb-2 ${
                        imgs.length === 1
                          ? 'flex'
                          : imgs.length === 2
                          ? 'grid grid-cols-2'
                          : 'grid grid-cols-3'
                      }`}
                    >
                      {imgs.map((item) => (
                        <div key={item.id} className="group relative rounded-xl overflow-hidden border border-border/50 aspect-video bg-muted/40">
                          <img
                            src={item.preview}
                            alt={item.file.name}
                            className="w-full h-full object-cover"
                          />
                          {/* overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                            <a
                              href={item.preview}
                              target="_blank"
                              rel="noreferrer"
                              className="flex size-7 items-center justify-center rounded-full bg-white/90 text-foreground hover:bg-white transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Eye className="size-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => removeFile(item.id)}
                              className="flex size-7 items-center justify-center rounded-full bg-white/90 text-foreground hover:bg-red-100 hover:text-red-600 transition-colors"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 hidden group-hover:block">
                            <p className="truncate rounded-lg bg-black/60 px-2 py-0.5 text-[10px] text-white">
                              {item.file.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {others.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {others.map((item) => (
                        <AttachmentChip
                          key={item.id}
                          file={item.file}
                          preview={item.preview}
                          onRemove={() => removeFile(item.id)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* ── Drop zone (shown when toggled) ── */}
        {showDropZone && (
          <div className="border-t border-border/50 bg-muted/10 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">Thêm tệp đính kèm</span>
              <button
                type="button"
                onClick={() => setShowDropZone(false)}
                className="rounded-md p-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <DropZone onFiles={addFiles} />
          </div>
        )}

        {/* ── Composer toolbar ── */}
        <div className="border-t border-border/50 bg-muted/5 px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5">
            {/* File picker */}
            <button
              type="button"
              title="Đính kèm tệp"
              onClick={() => { setShowDropZone((v) => !v) }}
              className={`rounded-lg p-2 transition-colors ${
                showDropZone
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-muted-foreground hover:bg-muted hover:text-indigo-600'
              }`}
            >
              <Paperclip className="size-4" />
            </button>

            {/* Image quick-pick */}
            <button
              type="button"
              title="Chọn hình ảnh"
              onClick={() => {
                const inp = document.createElement('input')
                inp.type = 'file'
                inp.accept = 'image/*'
                inp.multiple = true
                inp.onchange = (e) => addFiles(Array.from(e.target.files))
                inp.click()
              }}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-indigo-600 transition-colors"
            >
              <Image className="size-4" />
            </button>

            {/* Video quick-pick */}
            <button
              type="button"
              title="Chọn video"
              onClick={() => {
                const inp = document.createElement('input')
                inp.type = 'file'
                inp.accept = 'video/*'
                inp.multiple = true
                inp.onchange = (e) => addFiles(Array.from(e.target.files))
                inp.click()
              }}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-indigo-600 transition-colors"
            >
              <Video className="size-4" />
            </button>

            {attachedFiles.length > 0 && (
              <span className="ml-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-bold text-white">
                {attachedFiles.length}
              </span>
            )}
          </div>

          <Button
            onClick={handlePost}
            disabled={!canPost}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs shadow-indigo-600/30 gap-2 disabled:opacity-40"
          >
            <Send className="size-3.5" />
            Đăng
          </Button>
        </div>
      </div>

      {/* ── Posts List ── */}
      {posts.map((post) => (
        <article
          key={post.id}
          className={`rounded-2xl border bg-card shadow-xs transition-all hover:shadow-md ${
            post.pinned ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-border/70'
          }`}
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

            {post.content && (
              <p className="mt-4 text-sm leading-relaxed text-foreground whitespace-pre-line">{post.content}</p>
            )}

            {post.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {post.attachments.map((att) => (
                  <PostAttachment key={att.name} att={att} />
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
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-card py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-indigo-50">
        <ClipboardList className="size-7 text-indigo-500" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Chưa có bài tập nào</p>
        <p className="mt-1 text-sm text-muted-foreground">Bài tập do giảng viên tạo sẽ xuất hiện ở đây.</p>
      </div>
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
                {loading ? 'Đang tải...' : classInfo.subject}
              </span>

              <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
                {loading ? 'Đang tải lớp học...' : classInfo.title}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/75 leading-relaxed">
                {error || classInfo.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="size-4" />
                  {classInfo.teacher}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="size-4" />
                  {classInfo.student_count} học viên
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
                {classInfo.join_code || '-'}
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
        {activeTab === 'moinguoi' && <MoiNguoiTab classInfo={classInfo} />}
      </div>
    </div>
  )
}
