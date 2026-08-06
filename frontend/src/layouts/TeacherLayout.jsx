import { useState } from 'react'
import {
  BookOpenCheck,
  FileCheck,
  FolderPlus,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CreateClassModal } from '@/components/classes'
import { useAuth } from '@/context/useAuth'

const teacherNavItems = [
  { label: 'Overview', path: '/teacher', icon: LayoutDashboard },
  { label: 'My Courses', path: '/teacher/courses', icon: BookOpenCheck },
  { label: 'Assignments', path: '/teacher/assignments', icon: FileCheck },
  { label: 'Learners & Students', path: '/teacher/students', icon: UsersRound },
]

export function TeacherLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleClassCreated = (newClass) => {
    // Reload hoặc thông báo thành công nếu cần
    window.dispatchEvent(new CustomEvent('class_updated', { detail: newClass }))
  }

  return (
    <div className="min-h-svh bg-indigo-950/5 text-foreground flex">
      {/* Teacher Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-indigo-200/40 bg-indigo-950 text-indigo-100 lg:flex flex-col justify-between p-4 shadow-xl">
        <div>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500 text-white font-bold shadow-md">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-white">Smart Learning</p>
              <span className="inline-flex items-center rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-300">
                Instructor Suite
              </span>
            </div>
          </div>

          {/* Quick Action Button in Sidebar */}
          <div className="mt-6 px-1">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <FolderPlus className="size-4" />
              Tạo lớp học mới
            </Button>
          </div>

          <nav className="mt-6 grid gap-1.5">
            {teacherNavItems.map(({ label, path, icon: Icon }) => (
              <NavLink
                className={({ isActive }) =>
                  `flex h-11 items-center gap-3 rounded-lg px-3.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-md'
                      : 'text-indigo-200 hover:bg-indigo-900/60 hover:text-white'
                  }`
                }
                end={path === '/teacher'}
                key={path}
                to={path}
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="rounded-xl border border-indigo-900 bg-indigo-900/40 p-3.5">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'Instructor'}</p>
              <p className="text-xs text-indigo-300 truncate">{user?.email}</p>
            </div>
            <Button
              className="text-indigo-300 hover:text-red-300 hover:bg-indigo-900"
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
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800 uppercase tracking-wider">
                  Teacher Portal
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight mt-1">Classroom & Course Management</h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
              >
                <FolderPlus className="mr-1.5 size-4" />
                Tạo lớp
              </Button>
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

      {/* Modal tạo lớp học */}
      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleClassCreated}
      />
    </div>
  )
}
