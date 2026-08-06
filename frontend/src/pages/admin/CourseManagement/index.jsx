import { useEffect, useState } from 'react'
import { BookOpenCheck, Clock3, GraduationCap, Sparkles, UsersRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { classService } from '@/services/classService'

function formatDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return isoString
  }
}

export function AdminCourseManagementPage() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadClasses() {
      setLoading(true)
      setError('')
      try {
        const data = await classService.getMyClasses()
        if (!ignore) setClasses(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!ignore) setError(err.message || 'Không thể tải danh sách lớp học.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadClasses()
    return () => {
      ignore = true
    }
  }, [])

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Course management</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">Quản lý lớp học</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tổng quan tất cả lớp học trong hệ thống.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {!loading && (
            <span>
              {classes.length} lớp · {classes.filter((c) => c.status === 'ACTIVE').length} đang hoạt động
            </span>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
          Đang tải danh sách lớp học...
        </div>
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
          Chưa có lớp học nào trong hệ thống.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((course) => (
            <article
              className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm"
              key={course.id}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    course.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {course.status === 'ACTIVE' ? 'Hoạt động' : 'Lưu trữ'}
                </span>
                <Sparkles className="size-4 text-muted-foreground" aria-hidden="true" />
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-foreground">
                <GraduationCap className="size-4" aria-hidden="true" />
                <span className="line-clamp-1">{course.title}</span>
              </div>

              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="size-4" aria-hidden="true" />
                  <span>
                    {course.instructor?.full_name ?? 'Chưa có giảng viên'}
                    {course.subject ? ` · ${course.subject}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="size-4" aria-hidden="true" />
                  <span>Tạo ngày {formatDate(course.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UsersRound className="size-4" aria-hidden="true" />
                  <span>{course.student_count ?? 0} học viên đã đăng ký</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                <span className="font-mono text-xs tracking-widest text-muted-foreground">
                  {course.join_code}
                </span>
                <Button size="sm" type="button" variant="outline">
                  Xem
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
