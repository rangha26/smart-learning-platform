import { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink, FolderPlus, Key, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { CreateClassModal } from '@/components/classes'
import { Button } from '@/components/ui/button'
import { classService } from '@/services/classService'

export function TeacherMyCoursesPage() {
  const [courses, setCourses] = useState([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let ignore = false

    async function loadClasses() {
      setLoading(true)
      setError('')
      try {
        const data = await classService.getMyClasses()
        if (!ignore) {
          setCourses(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Không thể tải danh sách lớp học.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadClasses()
    return () => {
      ignore = true
    }
  }, [])

  const handleClassCreated = (newClass) => {
    setCourses((prev) => [newClass, ...prev])
  }

  // Lớp có thể được tạo qua modal ở Sidebar/Header (TeacherLayout), vốn dispatch
  // sự kiện này thay vì gọi thẳng vào state của trang. Lắng nghe để danh sách
  // luôn đồng bộ bất kể người dùng tạo lớp từ đâu.
  useEffect(() => {
    function handleClassUpdated(event) {
      const newClass = event.detail
      if (!newClass?.id) return
      setCourses((prev) => {
        if (prev.some((course) => course.id === newClass.id)) {
          return prev
        }
        return [newClass, ...prev]
      })
    }

    window.addEventListener('class_updated', handleClassUpdated)
    return () => window.removeEventListener('class_updated', handleClassUpdated)
  }, [])

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
    } finally {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Teacher workspace</p>
          <h2 className="text-2xl font-bold tracking-tight">Quản lý lớp học của tôi</h2>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700"
        >
          <FolderPlus className="mr-2 size-4" />
          Tạo lớp học mới
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <div className="rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
            Đang tải danh sách lớp học...
          </div>
        ) : null}

        {!loading && courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
            Chưa có lớp học nào. Hãy tạo lớp đầu tiên để lấy mã mời học viên.
          </div>
        ) : null}

        {courses.map((course) => (
          <article
            className="flex flex-col justify-between gap-4 rounded-2xl border bg-card p-5 text-card-foreground shadow-xs transition-all hover:border-indigo-200 hover:shadow-md"
            key={course.id ?? course.join_code ?? course.title}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{course.title}</h3>
                  {course.subject ? (
                    <span className="mt-1 inline-block rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      {course.subject}
                    </span>
                  ) : null}
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {course.status || 'ACTIVE'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-4 text-indigo-600" />
                <span className="font-medium">{course.student_count ?? 0} học viên</span>
              </div>

              {course.join_code ? (
                <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/60 px-2.5 py-1">
                  <Key className="size-3.5 text-indigo-600" />
                  <span className="font-mono font-bold tracking-wider text-foreground">
                    {course.join_code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(course.join_code)}
                    title="Sao chép mã tham gia"
                    className="ml-1 text-muted-foreground transition-colors hover:text-indigo-600"
                  >
                    {copiedCode === course.join_code ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
              ) : null}

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/teacher/class/${course.id}`)}
                disabled={!course.id}
                className="ml-auto gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                Xem lớp
                <ExternalLink className="size-3.5" />
              </Button>
            </div>
          </article>
        ))}
      </div>

      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleClassCreated}
      />
    </section>
  )
}
