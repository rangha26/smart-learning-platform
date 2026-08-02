const reportCards = [
  { label: 'Completion rate', value: '87%', detail: 'Across active courses' },
  { label: 'New enrollments', value: '124', detail: 'This month' },
  { label: 'At-risk learners', value: '18', detail: 'Need follow-up' },
]

export function AdminReportsPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Admin reports</p>
        <h2 className="text-2xl font-semibold tracking-normal">Reports</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {reportCards.map((report) => (
          <article className="rounded-lg border bg-card p-5 text-card-foreground" key={report.label}>
            <p className="text-sm text-muted-foreground">{report.label}</p>
            <p className="mt-3 text-3xl font-semibold">{report.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{report.detail}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
