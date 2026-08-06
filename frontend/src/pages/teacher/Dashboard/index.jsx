import { useEffect, useState } from 'react'
import { BookOpenCheck, ClipboardList, UsersRound } from 'lucide-react'

import { dashboardService } from '@/services/dashboardService'

function formatDueDate(isoString) {
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

export function TeacherDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadDashboard() {
      setLoading(true)
      setError('')
      try {
        const result = await dashboardService.getTeacherDashboard()
        if (!ignore) {
          setData(result)
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Không thể tải dữ liệu tổng quan giảng dạy.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadDashboard()
    return () => {
      ignore = true
    }
  }, [])

  const classes = data?.classes ?? []
  const upcomingAssignments = data?.upcoming_assignments ?? []

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Teacher dashboard</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal">Teaching overview</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Manage your classes, keep an eye on participation, and prepare the next lessons with confidence.
        </p>
      </header>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpenCheck className="size-4" aria-hidden="true" />
            <span className="text-sm">Active classes</span>
          </div>
          <p className="mt-4 text-3xl font-semibold">{loading ? '—' : data?.active_classes ?? 0}</p>
        </article>
        <article className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <UsersRound className="size-4" aria-hidden="true" />
            <span className="text-sm">Learners</span>
          </div>
          <p className="mt-4 text-3xl font-semibold">{loading ? '—' : data?.total_learners ?? 0}</p>
        </article>
        <article className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClipboardList className="size-4" aria-hidden="true" />
            <span className="text-sm">Bài chưa chấm điểm</span>
          </div>
          <p className="mt-4 text-3xl font-semibold">{loading ? '—' : data?.ungraded_submissions ?? 0}</p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Bài tập sắp đến hạn</h3>
          {loading ? (
            <div className="rounded-2xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
              Đang tải...
            </div>
          ) : null}
          {!loading && upcomingAssignments.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
              Không có bài tập nào sắp đến hạn.
            </div>
          ) : null}
          {upcomingAssignments.map((assignment) => (
            <article className="rounded-2xl border bg-card p-4" key={assignment.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{assignment.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{assignment.class_title}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  Hạn: {formatDueDate(assignment.due_date)}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Lớp học của tôi</h3>
          {loading ? (
            <div className="rounded-2xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
              Đang tải...
            </div>
          ) : null}
          {!loading && classes.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
              Bạn chưa có lớp học nào.
            </div>
          ) : null}
          {classes.map((course) => (
            <article className="rounded-2xl border bg-card p-4" key={course.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{course.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{course.student_count} learners</p>
                </div>
                <span
                  className={`text-sm font-medium ${
                    course.status === 'ACTIVE' ? 'text-emerald-600' : 'text-muted-foreground'
                  }`}
                >
                  {course.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã lưu trữ'}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
