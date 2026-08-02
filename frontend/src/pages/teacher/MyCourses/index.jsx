const courses = [
  { title: 'Frontend Foundations', status: 'Live', learners: 28 },
  { title: 'Design Systems', status: 'Draft', learners: 19 },
]

export function TeacherMyCoursesPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Teacher workspace</p>
        <h2 className="text-2xl font-semibold tracking-normal">My Courses</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((course) => (
          <article className="rounded-lg border bg-card p-5 text-card-foreground" key={course.title}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{course.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{course.learners} learners enrolled</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {course.status}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
