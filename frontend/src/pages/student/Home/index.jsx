import { BookOpenCheck, CalendarDays, Clock3, TrendingUp } from 'lucide-react'

const enrolledCourses = [
  { title: 'React Fundamentals', progress: '72%', nextLesson: 'Hooks and state' },
  { title: 'UI Systems', progress: '48%', nextLesson: 'Design tokens' },
]

const upcomingTasks = [
  { title: 'Assignment: Build a landing page', due: 'Tomorrow, 09:00' },
  { title: 'Live class: Component patterns', due: 'Friday, 19:30' },
]

export function StudentHomePage() {
  return (
    <section className="space-y-6">
      <header className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Student home</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal">Welcome back, Minh</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Your learning dashboard is ready with your active courses, upcoming sessions, and progress highlights.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpenCheck className="size-4" aria-hidden="true" />
            <span className="text-sm">Enrolled courses</span>
          </div>
          <p className="mt-4 text-3xl font-semibold">3</p>
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
            <span className="text-sm text-muted-foreground">Updated today</span>
          </div>

          {enrolledCourses.map((course) => (
            <article className="rounded-2xl border bg-card p-4" key={course.title}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{course.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Next: {course.nextLesson}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{course.progress}</p>
                  <p className="text-xs text-muted-foreground">completed</p>
                </div>
              </div>
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
    </section>
  )
}
