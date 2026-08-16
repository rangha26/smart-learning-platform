import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Award,
  BookOpenCheck,
  ClipboardList,
  Clock,
  FileText,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AssignmentEditorModal } from '@/components/classes/AssignmentEditorModal'
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await dashboardService.getTeacherDashboard()
      setData(result)
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu bài tập.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const upcomingAssignments = data?.upcoming_assignments ?? []
  const ungradedCount = data?.ungraded_submissions ?? 0

  const handleCreateSuccess = () => {
    loadData()
  }

  return (
    <section className="space-y-6">
      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Teacher workspace</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Quản lý Bài tập</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Danh sách bài tập sắp đến hạn, thống kê nộp bài và soạn thảo đề bài cho các lớp học.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="self-start sm:self-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 px-4 py-2 text-sm font-semibold"
        >
          <Plus className="mr-1.5 size-4" />
          Tạo bài tập mới
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClipboardList className="size-4 text-indigo-500" aria-hidden="true" />
            <span className="text-sm font-semibold text-foreground">Bài sắp đến hạn</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-foreground">
            {loading ? '—' : upcomingAssignments.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Trong các bài tập sắp tới</p>
        </article>
        <article className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="size-4 text-amber-500" aria-hidden="true" />
            <span className="text-sm font-semibold text-foreground">Bài chờ chấm điểm</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-foreground">
            {loading ? '—' : ungradedCount.toLocaleString('vi-VN')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Trên toàn bộ lớp học của bạn</p>
        </article>
      </div>

      {/* Assignments list */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Bài tập sắp đến hạn</h2>
          <span className="text-xs text-muted-foreground font-medium">
            {upcomingAssignments.length} bài tập
          </span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Đang tải danh sách bài tập...
          </div>
        ) : upcomingAssignments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-12 text-center shadow-xs">
            <div className="flex size-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <ClipboardList className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">Không có bài tập nào sắp đến hạn.</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Bạn có thể tạo bài tập mới cho các lớp học bằng nút bên dưới.
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="outline"
              className="mt-1 rounded-xl text-xs font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              <Plus className="mr-1 size-3.5" />
              Tạo bài tập ngay
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {upcomingAssignments.map((assignment) => {
              const overdue = isOverdue(assignment.due_date)
              return (
                <article
                  className="group rounded-2xl border border-border/80 bg-card p-5 text-card-foreground shadow-xs hover:border-indigo-200 hover:shadow-md transition-all"
                  key={assignment.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 group-hover:scale-105 transition-transform">
                        <BookOpenCheck className="size-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground group-hover:text-indigo-600 transition-colors">
                          {assignment.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground font-medium">
                          {assignment.class_title || 'Lớp học'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          overdue
                            ? 'bg-rose-500/10 text-rose-600 border border-rose-200'
                            : 'bg-indigo-500/10 text-indigo-600 border border-indigo-200'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          Hạn: {formatDueDate(assignment.due_date)}
                        </span>
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* Assignment Editor Modal */}
      <AssignmentEditorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </section>
  )
}

export default TeacherAssignmentsPage
