import {
  BarChart3,
  BookOpenCheck,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  UsersRound,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/useAuth'

const adminNavItems = [
  { label: 'Overview', path: '/admin', icon: LayoutDashboard },
  { label: 'User Management', path: '/admin/users', icon: UsersRound },
  { label: 'Course Management', path: '/admin/courses', icon: BookOpenCheck },
  { label: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-svh bg-slate-900/5 text-foreground flex">
      {/* Admin Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-slate-900 text-slate-100 lg:flex flex-col justify-between p-4 shadow-xl">
        <div>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-md">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-white">Smart Learning</p>
              <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                Admin Console
              </span>
            </div>
          </div>

          <nav className="mt-8 grid gap-1.5">
            {adminNavItems.map(({ label, path, icon: Icon }) => (
              <NavLink
                className={({ isActive }) =>
                  `flex h-11 items-center gap-3 rounded-lg px-3.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
                end={path === '/admin'}
                key={path}
                to={path}
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-850 p-3.5">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'Admin User'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@platform.com'}</p>
            </div>
            <Button
              className="text-slate-400 hover:text-red-400 hover:bg-slate-800"
              onClick={handleLogout}
              size="icon"
              title="Logout"
              variant="ghost"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-svh">
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur px-6 py-4 shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Admin Workspace
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight mt-1">Platform Control & Analytics</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-medium text-foreground">{user?.full_name}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
              <Button onClick={handleLogout} size="sm" variant="outline">
                <LogOut className="mr-2 size-4 text-destructive" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
