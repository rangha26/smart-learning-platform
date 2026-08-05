import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

export function AppLayout({ children }) {
  const pageTitle = {
    '/': 'Overview',
    '/courses': 'Courses',
    '/students': 'Students',
  }

  const currentPath = window.location.pathname
  const title = pageTitle[currentPath] ?? 'Dashboard'
  const description = 'Manage your learning platform from one place.'

  return (
    <div className="min-h-svh bg-background text-foreground">
      <Sidebar />

      <main className="min-h-svh lg:pl-64">
        <Header description={description} title={title} />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  )
}
