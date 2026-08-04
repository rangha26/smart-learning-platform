import { useState } from 'react'
import { BookOpenCheck, CalendarDays, Clock3, TrendingUp, UserPlus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JoinClassModal } from '@/components/classes'
import { useNavigate } from 'react-router-dom'

const defaultCourses = [
  { title: 'React Fundamentals', progress: '72%', nextLesson: 'Hooks and state' },
  { title: 'UI Systems', progress: '48%', nextLesson: 'Design tokens' },
]

const upcomingTasks = [
  { title: 'Assignment: Build a landing page', due: 'Tomorrow, 09:00' },
  { title: 'Live class: Component patterns', due: 'Friday, 19:30' },
]

export function StudentHomePage() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [courses, setCourses] = useState(defaultCourses)
  const navigate = useNavigate()

  const handleClassJoined = (newClass) => {
    setCourses((prev) => [
      {
        title: newClass.title,
        progress: '0%',
        nextLesson: newClass.subject ? `Chủ đề: ${newClass.subject}` : 'Bài học đầu tiên',
      },
      ...prev,
    ])
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Student home</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-normal">Welcome back, Learner</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your learning dashboard is ready with your active courses, upcoming sessions, and progress highlights.
          </p>
        </div>

        <Button
          onClick={() => setIsJoinModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20 shrink-0"
        >
          <UserPlus className="mr-2 size-4" />
          Tham gia lớp mới
        </Button>
      </header>

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
            <span className="text-sm">Upcoming sessions</span>
          </div>
          <p className="mt-4 text-3xl font-semibold">2</p>
        </article>
        <article className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="size-4" aria-hidden="true" />
            <span className="text-sm">Overall progress</span>
          </div>
          <p className="mt-4 text-3xl font-semibold">84%</p>
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
              className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            >
              + Tham gia bằng mã
            </Button>
          </div>

          {courses.map((course) => (
            <article className="rounded-2xl border bg-card p-4 transition-all hover:border-emerald-200 hover:shadow-xs" key={course.title}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{course.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Next: {course.nextLesson}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-700">{course.progress}</p>
                  <p className="text-xs text-muted-foreground">completed</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/student/class/1')}
                className="mt-3 w-full text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1.5"
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
            <span className="text-sm text-muted-foreground">This week</span>
          </div>

          {upcomingTasks.map((task) => (
            <article className="rounded-2xl border bg-card p-4" key={task.title}>
              <div className="flex items-start gap-2">
                <Clock3 className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Due {task.due}</p>
                </div>
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
