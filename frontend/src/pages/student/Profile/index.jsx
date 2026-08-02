const profileFields = [
  { label: 'Name', value: 'Minh Nguyen' },
  { label: 'Role', value: 'Student' },
  { label: 'Learning path', value: 'Frontend Developer' },
]

export function StudentProfilePage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Student portal</p>
        <h2 className="text-2xl font-semibold tracking-normal">Profile</h2>
      </div>

      <div className="rounded-lg border bg-card p-5 text-card-foreground">
        <dl className="grid gap-4 sm:grid-cols-3">
          {profileFields.map((field) => (
            <div key={field.label}>
              <dt className="text-sm text-muted-foreground">{field.label}</dt>
              <dd className="mt-1 font-medium">{field.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
