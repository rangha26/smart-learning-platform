import { useEffect, useState } from 'react'
import { AlertCircle, BookOpenCheck, ClipboardList } from 'lucide-react'

import { dashboardService } from '@/services/dashboardService'

function formatDueDate(isoString) {
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

function isOverdue(isoString) {
  try {
    return new Date(isoString) < new Date()
  } catch {
    return false
  }
}

export function TeacherAssignmentsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const result = await dashboardService.getTeacherDashboard()
        if (!ignore) setData(result)
      } catch (err) {
        if (!ignore) setError(err.message || 'Không thể tải dữ liệu bài tập.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadData()
    return () => {
      ignore = true
    }
  }, [])

  const upcomingAssignments = data?.upcoming_assignments ?? []
  const ungradedCount = data?.ungraded_submissions ?? 0

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Teacher workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">Bài tập</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Danh sách bài tập sắp đến hạn và số bài chưa chấm điểm trong các lớp của bạn.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClipboardList className="size-4" aria-hidden="true" />
            <span className="text-sm">Bài sắp đến hạn</span>
          </div>
          <p className="mt-4 text-3xl font-semibold">
            {loading ? '—' : upcomingAssignments.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Trong 5 bài tiếp theo</p>
        </article>
        <article className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="size-4" aria-hidden="true" />
            <span className="text-sm">Bài chờ chấm điểm</span>
          </div>
          <p className="mt-4 text-3xl font-semibold">
            {loading ? '—' : ungradedCount.toLocaleString('vi-VN')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Trên toàn bộ lớp học của bạn</p>
        </article>
      </div>

      {/* Assignments list */}
      <div>
        <h2 className="mb-3 text-base font-semibold">Bài tập sắp đến hạn</h2>

        {loading ? (
          <div className="rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
            Đang tải danh sách bài tập...
          </div>
        ) : upcomingAssignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
            Không có bài tập nào sắp đến hạn.
          </div>
        ) : (
          <div className="grid gap-4">
            {upcomingAssignments.map((assignment) => {
              const overdue = isOverdue(assignment.due_date)
              return (
                <article
                  className="rounded-lg border bg-card p-5 text-card-foreground"
                  key={assignment.id}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <BookOpenCheck className="size-4" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-medium">{assignment.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {assignment.class_title}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`self-start rounded-full px-2.5 py-1 text-xs font-medium sm:self-center ${
                        overdue
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      Hạn: {formatDueDate(assignment.due_date)}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
