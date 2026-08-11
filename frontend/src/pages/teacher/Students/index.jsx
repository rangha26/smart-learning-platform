import { useEffect, useState } from 'react'
import { BookOpenCheck, ExternalLink, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { dashboardService } from '@/services/dashboardService'

export function TeacherStudentsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let ignore = false

    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const result = await dashboardService.getTeacherDashboard()
        if (!ignore) setData(result)
      } catch (err) {
        if (!ignore) setError(err.message || 'Không thể tải danh sách học viên.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadData()
    return () => {
      ignore = true
    }
  }, [])

  const classes = data?.classes ?? []
  const totalLearners = data?.total_learners ?? 0

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Teacher workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">Học viên của tôi</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Xem số lượng học viên trong từng lớp học bạn đang phụ trách.
          </p>
        </div>
        {!loading && (
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <UsersRound className="size-4" />
            <span>{totalLearners.toLocaleString('vi-VN')} học viên tổng cộng</span>
          </div>
        )}
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
          Đang tải danh sách học viên...
        </div>
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
          Bạn chưa có lớp học nào. Hãy tạo lớp để bắt đầu giảng dạy.
        </div>
      ) : (
        <div className="grid gap-4">
          {classes.map((course) => (
            <article
              className="flex items-center justify-between rounded-lg border bg-card p-5 text-card-foreground"
              key={course.id}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BookOpenCheck className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium">{course.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {course.subject ?? 'Không có chủ đề'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <p className="font-semibold">{course.student_count ?? 0}</p>
                  <p className="text-xs text-muted-foreground">học viên</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    course.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {course.status === 'ACTIVE' ? 'Hoạt động' : 'Lưu trữ'}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/teacher/class/${course.id}`)}
                  disabled={!course.id}
                  className="gap-1.5"
                >
                  Xem lớp
                  <ExternalLink className="size-3.5" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
