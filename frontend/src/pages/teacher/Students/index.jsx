const students = [
  { name: 'Minh Nguyen', course: 'Frontend Foundations', progress: '78%' },
  { name: 'Linh Tran', course: 'Design Systems', progress: '91%' },
]

export function TeacherStudentsPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Teacher workspace</p>
        <h2 className="text-2xl font-semibold tracking-normal">Students</h2>
      </div>

      <div className="grid gap-4">
        {students.map((student) => (
          <article className="rounded-lg border bg-card p-5 text-card-foreground" key={student.name}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{student.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{student.course}</p>
              </div>
              <span className="text-sm font-medium">{student.progress} complete</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
