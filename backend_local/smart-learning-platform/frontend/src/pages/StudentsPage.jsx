import { CheckCircle2, UserRound } from 'lucide-react'

const students = [
  { name: 'Alicia Chen', progress: '92% complete' },
  { name: 'Mateo Diaz', progress: '74% complete' },
  { name: 'Sora Kim', progress: '86% complete' },
]

export function StudentsPage() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Student progress</p>
        <h2 className="text-2xl font-semibold tracking-normal">Students</h2>
      </div>

      <div className="grid gap-4">
        {students.map((student) => (
          <article className="flex items-center justify-between rounded-lg border bg-card p-4" key={student.name}>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-muted-foreground">{student.progress}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              <span>On track</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
