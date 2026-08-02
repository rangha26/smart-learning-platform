import { BookOpenCheck, Clock3, GraduationCap, Sparkles, UsersRound } from 'lucide-react'

import { Button } from '@/components/ui/button'

const classes = [
  {
    title: 'React Fundamentals',
    mentor: 'Ms. Linh',
    schedule: 'Mon • Wed • 19:00',
    students: 28,
    status: 'Open for enrollment',
    badge: 'Popular',
  },
  {
    title: 'UI Systems',
    mentor: 'Mr. Duy',
    schedule: 'Tue • Thu • 20:00',
    students: 18,
    status: 'Starting soon',
    badge: 'New',
  },
  {
    title: 'Backend APIs',
    mentor: 'Ms. Hoa',
    schedule: 'Sat • 09:00',
    students: 35,
    status: 'Full',
    badge: 'Trending',
  },
]

export function AdminCourseManagementPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Course management</p>
          <h2 className="text-2xl font-semibold tracking-normal">Courses</h2>
        </div>
        <Button type="button">Create class</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {classes.map((course) => (
          <article className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm" key={course.title}>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {course.badge}
              </span>
              <Sparkles className="size-4 text-muted-foreground" aria-hidden="true" />
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-foreground">
              <GraduationCap className="size-4" aria-hidden="true" />
              <span>{course.title}</span>
            </div>

            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="size-4" aria-hidden="true" />
                <span>Mentor: {course.mentor}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="size-4" aria-hidden="true" />
                <span>{course.schedule}</span>
              </div>
              <div className="flex items-center gap-2">
                <UsersRound className="size-4" aria-hidden="true" />
                <span>{course.students} students enrolled</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <span>{course.status}</span>
              <Button size="sm" type="button" variant="outline">
                View
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
