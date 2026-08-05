import { BookOpenCheck, Clock3, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

const courses = [
  { title: 'React Fundamentals', meta: '8 lessons • 2h 30m', badge: 'Popular' },
  { title: 'UI Systems', meta: '6 lessons • 1h 45m', badge: 'New' },
  { title: 'Backend APIs', meta: '10 lessons • 3h 15m', badge: 'Trending' },
]

export function CoursesPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Learning library</p>
          <h2 className="text-2xl font-semibold tracking-normal">Courses</h2>
        </div>
        <Button type="button">Create course</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <article className="rounded-lg border bg-card p-5 text-card-foreground" key={course.title}>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {course.badge}
              </span>
              <Sparkles className="size-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpenCheck className="size-4" aria-hidden="true" />
              <span>{course.title}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="size-4" aria-hidden="true" />
              <span>{course.meta}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
