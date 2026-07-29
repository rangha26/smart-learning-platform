import { BookOpenCheck, GraduationCap, LayoutDashboard, UsersRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Courses', path: '/courses', icon: BookOpenCheck },
  { label: 'Students', path: '/students', icon: UsersRound },
]

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar px-4 py-5 lg:block">
      <div className="flex items-center gap-3 px-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <GraduationCap className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold">Smart Learning</p>
          <p className="text-xs text-muted-foreground">Admin Console</p>
        </div>
      </div>

      <nav className="mt-8 grid gap-1">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            className={({ isActive }) =>
              `flex h-10 items-center gap-3 rounded-md px-3 text-sm ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`
            }
            end={path === '/'}
            key={label}
            to={path}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
