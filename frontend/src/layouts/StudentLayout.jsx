import {
  BookOpen,
  Compass,
  GraduationCap,
  Home,
  LogOut,
  User,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/useAuth'

const studentNavItems = [
  { label: 'Home Dashboard', path: '/student', icon: Home },
  { label: 'My Learning', path: '/student/learning', icon: BookOpen },
  { label: 'My Profile', path: '/student/profile', icon: User },
]

export function StudentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-svh bg-emerald-950/5 text-foreground flex flex-col">
      {/* Top Header & Navbar for Student */}
      <header className="sticky top-0 z-30 border-b border-emerald-100 bg-background/95 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow-md">
                <GraduationCap className="size-6" />
              </div>
              <div>
                <p className="text-base font-bold tracking-tight text-foreground">Smart Learning</p>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  Student Portal
                </span>
              </div>
            </div>

            {/* Desktop Top Nav Navigation */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {studentNavItems.map(({ label, path, icon: Icon }) => (
                <NavLink
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60 shadow-xs'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                  end={path === '/student'}
                  key={path}
                  to={path}
                >
                  <Icon className="size-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-foreground">{user?.full_name || 'Learner'}</span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
            </div>
            <div className="flex size-9 items-center justify-center rounded-full bg-emerald-600 font-bold text-white shadow-xs">
              {(user?.full_name || 'S').charAt(0).toUpperCase()}
            </div>
            <Button onClick={handleLogout} size="sm" variant="outline">
              <LogOut className="mr-1.5 size-4 text-destructive" />
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <nav className="flex md:hidden items-center justify-around border-t border-border/60 bg-muted/30 px-3 py-2">
          {studentNavItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-muted-foreground'
                }`
              }
              end={path === '/student'}
              key={path}
              to={path}
            >
              <Icon className="size-4" />
              <span>{label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
