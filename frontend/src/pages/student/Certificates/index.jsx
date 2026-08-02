const certificates = [
  { title: 'React Fundamentals', issued: 'Issued Jul 2026' },
  { title: 'UI Systems Basics', issued: 'Issued Jun 2026' },
]

export function StudentCertificatesPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Student portal</p>
        <h2 className="text-2xl font-semibold tracking-normal">Certificates</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {certificates.map((certificate) => (
          <article className="rounded-lg border bg-card p-5 text-card-foreground" key={certificate.title}>
            <p className="font-medium">{certificate.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{certificate.issued}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
