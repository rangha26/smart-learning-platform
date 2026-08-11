import { useEffect, useState } from 'react'
import { BookOpenCheck, GraduationCap, ShieldCheck, UserRound, Users2 } from 'lucide-react'

import { classService } from '@/services/classService'
import { dashboardService } from '@/services/dashboardService'

export function AdminUserManagementPage() {
  const [stats, setStats] = useState(null)
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const [statsData, classesData] = await Promise.all([
          dashboardService.getAdminDashboard(),
          classService.getMyClasses(),
        ])
        if (!ignore) {
          setStats(statsData)
          setClasses(Array.isArray(classesData) ? classesData : [])
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Không thể tải dữ liệu người dùng.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadData()
    return () => {
      ignore = true
    }
  }, [])

  const roleCards = [
    {
      label: 'Tổng người dùng',
      value: stats?.total_users ?? 0,
      icon: Users2,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Học viên',
      value: stats?.total_students ?? 0,
      icon: GraduationCap,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Giảng viên',
      value: stats?.total_instructors ?? 0,
      icon: BookOpenCheck,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Quản trị viên',
      value: stats?.total_admins ?? 0,
      icon: ShieldCheck,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ]

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">User management</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">Quản lý người dùng</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Tổng quan người dùng theo vai trò và danh sách lớp học trong hệ thống.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      {/* Role stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {roleCards.map(({ label, value, icon: Icon, color, bg }) => (
          <article className="rounded-lg border bg-card p-5 text-card-foreground" key={label}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <span className={`flex size-8 items-center justify-center rounded-full ${bg}`}>
                <Icon className={`size-4 ${color}`} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold">
              {loading ? '—' : value.toLocaleString('vi-VN')}
            </p>
          </article>
        ))}
      </div>

      {/* Classes list – phần dữ liệu có sẵn từ backend */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Danh sách lớp học</h2>

        {loading ? (
          <div className="rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
            Đang tải danh sách lớp học...
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
            Chưa có lớp học nào trong hệ thống.
          </div>
        ) : (
          <div className="grid gap-3">
            {classes.map((course) => (
              <article
                className="flex items-center justify-between rounded-lg border bg-card p-4"
                key={course.id}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserRound className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium">{course.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.instructor?.full_name ?? 'Không rõ giảng viên'}
                      {course.subject ? ` · ${course.subject}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {course.student_count ?? 0} học viên
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      course.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {course.status === 'ACTIVE' ? 'Hoạt động' : 'Lưu trữ'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
