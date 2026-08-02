const assignments = [
  { title: 'Landing page critique', due: 'Due Friday', submissions: '21 submitted' },
  { title: 'API integration lab', due: 'Due next Monday', submissions: '9 submitted' },
]

export function TeacherAssignmentsPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Teacher workspace</p>
        <h2 className="text-2xl font-semibold tracking-normal">Assignments</h2>
      </div>

      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <article className="rounded-lg border bg-card p-5 text-card-foreground" key={assignment.title}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{assignment.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{assignment.due}</p>
              </div>
              <span className="text-sm font-medium text-emerald-600">{assignment.submissions}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
