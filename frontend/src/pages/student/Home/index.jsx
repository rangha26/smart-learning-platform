import { useEffect, useState } from 'react'
import { ArrowRight, BookOpenCheck, CalendarDays, Clock3, TrendingUp, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { JoinClassModal } from '@/components/classes'
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
  const [courses, setCourses] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let ignore = false

    async function loadHomeData() {
      setLoading(true)
      setError('')
      try {
        const [coursesData, dashboardData] = await Promise.all([
          classService.getMyClasses(),
          dashboardService.getStudentDashboard(),
        ])
        if (!ignore) {
          setCourses(Array.isArray(coursesData) ? coursesData : [])
          setDashboard(dashboardData)
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Không thể tải dữ liệu trang chủ.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadHomeData()
    return () => {
      ignore = true
    }
  }, [])

  const handleClassJoined = (newClass) => {
    setCourses((prev) => {
      const withoutDuplicate = prev.filter((course) => course.id !== newClass.id)
      return [newClass, ...withoutDuplicate]
    })
  }

  // Lớp có thể được tham gia qua modal ở Header (StudentLayout), vốn dispatch
  // sự kiện này thay vì gọi thẳng vào state của trang. Lắng nghe để danh sách
  // luôn đồng bộ bất kể người dùng tham gia lớp từ đâu.
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

  return (
    <section className="space-y-6">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border bg-card p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Student home</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-normal">Welcome back, Learner</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your learning dashboard is ready with your active courses, upcoming sessions, and progress highlights.
          </p>
        </div>

        <Button
          onClick={() => setIsJoinModalOpen(true)}
          className="shrink-0 bg-emerald-600 font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700"
        >
          <UserPlus className="mr-2 size-4" />
          Tham gia lớp mới
        </Button>
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
            <span className="text-sm">Enrolled courses</span>
          </div>
          <p className="mt-4 text-3xl font-semibold">{courses.length}</p>
        </article>
        <article className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="size-4" aria-hidden="true" />
            <span className="text-sm">Bài tập sắp đến hạn</span>
          </div>
          <p className="mt-4 text-3xl font-semibold">
            {loading ? '—' : dashboard?.upcoming_assignments?.length ?? 0}
          </p>
        </article>
        <article className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="size-4" aria-hidden="true" />
            <span className="text-sm">Overall progress</span>
          </div>
          <p className="mt-4 text-3xl font-semibold">
            {loading ? '—' : `${dashboard?.overall_progress ?? 0}%`}
          </p>
          {!loading && dashboard ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {dashboard.submitted_count}/{dashboard.total_assignments} bài đã nộp
            </p>
          ) : null}
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">My courses</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsJoinModalOpen(true)}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              + Tham gia bằng mã
            </Button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
              Đang tải danh sách lớp học...
            </div>
          ) : null}

          {!loading && courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
              Bạn chưa tham gia lớp nào. Nhập mã lớp từ giảng viên để bắt đầu.
            </div>
          ) : null}

          {courses.map((course) => (
            <article
              className="rounded-2xl border bg-card p-4 transition-all hover:border-emerald-200 hover:shadow-xs"
              key={course.id ?? course.join_code ?? course.title}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{course.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {course.subject ? `Chủ đề: ${course.subject}` : 'Bài học đầu tiên'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-700">0%</p>
                  <p className="text-xs text-muted-foreground">completed</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/student/class/${course.id}`)}
                disabled={!course.id}
                className="mt-3 w-full gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                Vào lớp
                <ArrowRight className="size-3.5" />
              </Button>
            </article>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Upcoming tasks</h3>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
              Đang tải...
            </div>
          ) : null}

          {!loading && (dashboard?.upcoming_assignments?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
              Không có bài tập nào sắp đến hạn.
            </div>
          ) : null}

          {dashboard?.upcoming_assignments?.map((task) => (
            <article className="rounded-2xl border bg-card p-4" key={task.id}>
              <div className="flex items-start gap-2">
                <Clock3 className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
                <div className="flex-1">
                  <p className="font-medium">{task.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {task.class_title} · Due {formatDueDate(task.due_date)}
                  </p>
                </div>
                {task.submitted ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    Đã nộp
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>

      <JoinClassModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={handleClassJoined}
      />
    </section>
  )
}
