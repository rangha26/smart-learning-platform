import { BookOpenCheck, CircleCheckBig, UsersRound } from 'lucide-react'

const sessions = [
  { title: 'Live Q&A session', students: 24, status: 'Scheduled' },
  { title: 'Review lab', students: 16, status: 'Preparing' },
]

const classes = [
  { title: 'Frontend Foundations', learners: 28, trend: 'High engagement' },
  { title: 'Design Systems', learners: 19, trend: 'Stable growth' },
]

export function TeacherDashboardPage() {
  return (
    <section className="space-y-6">
      <header className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Teacher dashboard</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal">Teaching overview</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Manage your classes, keep an eye on participation, and prepare the next lessons with confidence.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpenCheck className="size-4" aria-hidden="true" />
            <span className="text-sm">Active classes</span>
          </div>
          <p className="mt-4 text-3xl font-semibold">4</p>
        </article>
        <article className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <UsersRound className="size-4" aria-hidden="true" />
            <span className="text-sm">Learners</span>
          </div>
          <p className="mt-4 text-3xl font-semibold">132</p>
        </article>
        <article className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CircleCheckBig className="size-4" aria-hidden="true" />
            <span className="text-sm">Attendance</span>
          </div>
          <p className="mt-4 text-3xl font-semibold">91%</p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Upcoming sessions</h3>
          {sessions.map((session) => (
            <article className="rounded-2xl border bg-card p-4" key={session.title}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{session.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{session.students} learners joined</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {session.status}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Class performance</h3>
          {classes.map((course) => (
            <article className="rounded-2xl border bg-card p-4" key={course.title}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{course.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{course.learners} learners</p>
                </div>
                <span className="text-sm font-medium text-emerald-600">{course.trend}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
