import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Hash,
  Loader2,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { classService } from '@/services/classService'

// ─── Join Class Modal ────────────────────────────────────────────────────────

function JoinModal({ onClose, onSuccess }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')
    try {
      const joined = await classService.joinClass(trimmed)
      onSuccess(joined)
      onClose()
    } catch (err) {
      setError(err.message || 'Mã không hợp lệ hoặc lớp không tồn tại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Tham gia lớp học"
    >
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tham gia lớp học</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Nhập mã lớp do giảng viên cung cấp để tham gia.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Hash className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              id="join-class-code-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VD: ABC123"
              maxLength={10}
              className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-4 text-sm font-mono uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              autoFocus
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <Button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
          >
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            {loading ? 'Đang tham gia...' : 'Tham gia'}
          </Button>
        </form>
      </div>
    </div>
  )
}

// ─── Class Card ──────────────────────────────────────────────────────────────

function ClassCard({ course, onNavigate }) {
  const initials = course.title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <article className="group flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-sm">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-foreground">{course.title}</p>
          {course.subject ? (
            <p className="mt-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 inline-block">
              {course.subject}
            </p>
          ) : null}
        </div>
      </div>

      {/* Description */}
      {course.description ? (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {course.description}
        </p>
      ) : null}

      {/* Meta */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="size-3.5" />
          {course.student_count ?? 0} học viên
        </span>
        <span className="flex items-center gap-1">
          <Hash className="size-3.5" />
          {course.join_code}
        </span>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            course.status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {course.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã lưu trữ'}
        </span>
      </div>

      {/* Instructor */}
      {course.instructor ? (
        <p className="mt-2 text-xs text-muted-foreground">
          GV: <span className="font-medium text-foreground">{course.instructor.full_name}</span>
        </p>
      ) : null}

      {/* Action */}
      <Button
        id={`enter-class-btn-${course.id}`}
        size="sm"
        variant="outline"
        onClick={() => onNavigate(course.id)}
        disabled={!course.id}
        className="mt-4 w-full gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
      >
        Vào lớp
        <ArrowRight className="size-3.5" />
      </Button>
    </article>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function StudentLearningPage() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let ignore = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await classService.getMyClasses()
        if (!ignore) {
          setClasses(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Không thể tải danh sách lớp.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()
    return () => { ignore = true }
  }, [])

  // Sync khi join từ nơi khác (ví dụ Home page)
  useEffect(() => {
    function handleClassUpdated(e) {
      const newClass = e.detail
      if (!newClass?.id) return
      setClasses((prev) =>
        prev.some((c) => c.id === newClass.id) ? prev : [newClass, ...prev]
      )
    }
    window.addEventListener('class_updated', handleClassUpdated)
    return () => window.removeEventListener('class_updated', handleClassUpdated)
  }, [])

  const handleJoinSuccess = (newClass) => {
    setClasses((prev) => {
      const without = prev.filter((c) => c.id !== newClass.id)
      return [newClass, ...without]
    })
    window.dispatchEvent(new CustomEvent('class_updated', { detail: newClass }))
  }

  const filtered = classes.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.title.toLowerCase().includes(q) ||
      (c.subject ?? '').toLowerCase().includes(q) ||
      (c.instructor?.full_name ?? '').toLowerCase().includes(q)
    )
  })

  const activeCount = classes.filter((c) => c.status === 'ACTIVE').length

  return (
    <section className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col justify-between gap-4 rounded-2xl border bg-card p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Student portal</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">My Learning</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? 'Đang tải...' : `${activeCount} lớp đang hoạt động · ${classes.length} tổng`}
          </p>
        </div>
        <Button
          id="open-join-class-modal-btn"
          onClick={() => setShowJoinModal(true)}
          className="shrink-0 gap-2 bg-emerald-600 font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700"
        >
          <Plus className="size-4" />
          Tham gia lớp mới
        </Button>
      </header>

      {/* Error */}
      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      {/* Search */}
      {!loading && classes.length > 0 ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            id="learning-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm lớp học, môn học, giáo viên..."
            className="w-full rounded-xl border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          {search ? (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Xóa tìm kiếm"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : null}

      {/* Empty state */}
      {!loading && classes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-card py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50">
            <BookOpen className="size-8 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Chưa có lớp học nào</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nhập mã lớp từ giảng viên để bắt đầu học.
            </p>
          </div>
          <Button
            onClick={() => setShowJoinModal(true)}
            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Plus className="size-4" />
            Tham gia lớp đầu tiên
          </Button>
        </div>
      ) : null}

      {/* No search result */}
      {!loading && classes.length > 0 && filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
          Không tìm thấy lớp nào phù hợp với &quot;{search}&quot;.
        </div>
      ) : null}

      {/* Class grid */}
      {!loading && filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <ClassCard
              key={course.id}
              course={course}
              onNavigate={(id) => navigate(`/student/class/${id}`)}
            />
          ))}
        </div>
      ) : null}

      {/* Join Modal */}
      {showJoinModal ? (
        <JoinModal
          onClose={() => setShowJoinModal(false)}
          onSuccess={handleJoinSuccess}
        />
      ) : null}
    </section>
  )
}
