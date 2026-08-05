import { ArrowRight, BookOpenCheck, Sparkles, UsersRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import apiClient from '@/services/axios'

const stats = [
  { label: 'Active students', value: '1,248', icon: UsersRound },
  { label: 'Courses online', value: '36', icon: BookOpenCheck },
  { label: 'AI suggestions', value: '84', icon: Sparkles },
]

export function HomePage() {
  return (
    <>
      <header className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
            Smart Learning Platform
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            TailwindCSS and shadcn/ui are ready for the frontend workflow.
          </p>
        </div>

        <Button type="button">
          New lesson
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Learning summary">
        {stats.map(({ label, value, icon: Icon }) => (
          <article className="rounded-lg border bg-card p-5 text-card-foreground" key={label}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="mt-4 text-3xl font-semibold">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border bg-card p-5 text-card-foreground">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-normal">API service</h2>
            <p className="mt-1 text-sm text-muted-foreground">{import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}</p>
          </div>
          <Button
            onClick={() => {
              apiClient.get('/').catch(() => {})
            }}
            type="button"
            variant="outline"
          >
            Check status
          </Button>
        </div>
      </section>
    </>
  )
}
