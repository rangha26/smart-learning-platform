import { useEffect, useState } from 'react'
import { ArrowRight, BookOpenCheck, CalendarDays, Clock3, TrendingUp, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { JoinClassModal, StudentAssignmentDetailModal } from '@/components/classes'
import { Button } from '@/components/ui/button'
import { classService } from '@/services/classService'
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

export function StudentHomePage() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [courses, setCourses] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const loadHomeData = async () => {
    setLoading(true)
    setError('')
    try {
      const [coursesData, dashboardData] = await Promise.all([
        classService.getMyClasses(),
        dashboardService.getStudentDashboard(),
      ])
      setCourses(Array.isArray(coursesData) ? coursesData : [])
      setDashboard(dashboardData)
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu trang chủ.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHomeData()
  }, [])

  const handleClassJoined = (newClass) => {
    setCourses((prev) => [newClass, ...prev])
    loadHomeData()
  }

  return (
    <section className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="rounded-2xl border bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
              Student Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
              Chào mừng trở lại! 👋
            </h1>
            <p className="mt-1 text-sm text-emerald-100">
              Tiếp tục hành trình học tập và hoàn thành các bài tập đúng hạn.
            </p>
          </div>
          <Button
            onClick={() => setIsJoinModalOpen(true)}
            className="self-start rounded-xl bg-white text-emerald-800 shadow-md hover:bg-emerald-50 md:self-auto font-semibold"
          >
            <UserPlus className="mr-2 size-4" />
            Tham gia lớp học
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpenCheck className="size-4 text-emerald-600" />
            <span className="text-sm font-semibold text-foreground">Lớp đã tham gia</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-foreground">
            {loading ? '—' : dashboard?.enrolled_classes_count ?? courses.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Lớp học đang theo dõi</p>
        </article>

        <article className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="size-4 text-amber-500" />
            <span className="text-sm font-semibold text-foreground">Bài tập sắp tới</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-foreground">
            {loading ? '—' : dashboard?.upcoming_assignments?.length ?? 0}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Cần hoàn thành sớm</p>
        </article>

        <article className="rounded-2xl border bg-card p-5 shadow-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="size-4 text-indigo-500" />
            <span className="text-sm font-semibold text-foreground">Tiến độ nộp bài</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-foreground">
            {loading ? '—' : `${dashboard?.completion_rate ?? 0}%`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {dashboard?.submitted_count ?? 0}/{dashboard?.total_assignments ?? 0} bài đã nộp
          </p>
        </article>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Classes List (2 cols) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Lớp học của tôi</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/student/learning')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Xem tất cả ({courses.length})
              <ArrowRight className="ml-1 size-3.5" />
            </Button>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 rounded-2xl border bg-card animate-pulse" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center bg-card">
              <p className="text-sm text-muted-foreground">Bạn chưa tham gia lớp học nào.</p>
              <Button
                onClick={() => setIsJoinModalOpen(true)}
                variant="outline"
                className="mt-3 rounded-xl text-xs font-semibold text-emerald-700 border-emerald-200"
              >
                Nhập mã tham gia
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {courses.slice(0, 4).map((course) => (
                <article
                  key={course.id}
                  className="group flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-xs hover:border-emerald-200 hover:shadow-md transition-all"
                >
                  <div>
                    <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 mb-2">
                      {course.subject || 'Lớp học'}
                    </span>
                    <h3 className="font-bold text-foreground group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {course.description || 'Không có mô tả.'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/student/class/${course.id}`)}
                    className="mt-4 w-full gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-semibold"
                  >
                    Vào lớp học
                    <ArrowRight className="size-3.5" />
                  </Button>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Tasks (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Bài tập sắp đến hạn</h2>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
              Đang tải...
            </div>
          ) : !dashboard?.upcoming_assignments?.length ? (
            <div className="rounded-2xl border border-dashed bg-card p-6 text-center text-xs text-muted-foreground">
              Tuyệt vời! Bạn không có bài tập nào sắp đến hạn.
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.upcoming_assignments.map((task) => (
                <article
                  key={task.id}
                  onClick={() =>
                    setSelectedTask({
                      id: task.id,
                      title: task.title,
                      due_date: task.due_date,
                      max_score: task.max_score || 10,
                      description: task.description || '',
                      file_url: task.file_url || null,
                    })
                  }
                  className="group rounded-2xl border bg-card p-4 shadow-xs hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                      <Clock3 className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-foreground group-hover:text-emerald-700 transition-colors truncate">
                        {task.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                        {task.class_title} · Hạn: {formatDueDate(task.due_date)}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
                      Nộp bài
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <JoinClassModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={handleClassJoined}
      />

      <StudentAssignmentDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        assignment={selectedTask}
        onSubmissionUpdated={() => loadHomeData()}
      />
    </section>
  )
}

export default StudentHomePage
