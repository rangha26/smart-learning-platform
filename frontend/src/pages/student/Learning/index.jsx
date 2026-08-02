const lessons = [
  { title: 'Hooks and state', course: 'React Fundamentals', progress: 'In progress' },
  { title: 'Design tokens', course: 'UI Systems', progress: 'Next lesson' },
]

export function StudentLearningPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Student portal</p>
        <h2 className="text-2xl font-semibold tracking-normal">Learning</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {lessons.map((lesson) => (
          <article className="rounded-lg border bg-card p-5 text-card-foreground" key={lesson.title}>
            <p className="font-medium">{lesson.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{lesson.course}</p>
            <p className="mt-4 text-sm font-medium text-primary">{lesson.progress}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
