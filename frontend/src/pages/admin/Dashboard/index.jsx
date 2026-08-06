import { useEffect, useState } from 'react'
import { Archive, BookOpenCheck, ClipboardList, FileCheck2, Users2 } from 'lucide-react'

import { dashboardService } from '@/services/dashboardService'

export function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadStats() {
      setLoading(true)
      setError('')
      try {
        const data = await dashboardService.getAdminDashboard()
        if (!ignore) {
          setStats(data)
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Không thể tải dữ liệu thống kê hệ thống.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadStats()
    return () => {
      ignore = true
    }
  }, [])

  const statCards = [
    {
      label: 'Tổng người dùng',
      value: stats?.total_users ?? 0,
      helper: stats
        ? `${stats.total_students} học viên · ${stats.total_instructors} giảng viên · ${stats.total_admins} quản trị`
        : '',
      icon: Users2,
    },
    {
      label: 'Lớp học hoạt động',
      value: stats?.active_classes ?? 0,
      helper: stats ? `${stats.total_classes} lớp · ${stats.archived_classes} đã lưu trữ` : '',
      icon: BookOpenCheck,
    },
    {
      label: 'Tổng bài tập',
      value: stats?.total_assignments ?? 0,
      helper: 'Trên toàn hệ thống',
      icon: ClipboardList,
    },
    {
      label: 'Tổng bài nộp',
      value: stats?.total_submissions ?? 0,
      helper: 'Trên toàn hệ thống',
      icon: FileCheck2,
    },
  ]

  return (
    <>
      <header className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
            Smart Learning Platform
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Tổng quan thống kê toàn hệ thống: người dùng, lớp học, bài tập và bài nộp.
          </p>
        </div>
      </header>

      {error ? (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Learning summary">
        {statCards.map(({ label, value, helper, icon: Icon }) => (
          <article className="rounded-lg border bg-card p-5 text-card-foreground" key={label}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="mt-4 text-3xl font-semibold">{loading ? '—' : value.toLocaleString('vi-VN')}</p>
            {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-lg border bg-card p-5 text-card-foreground">
        <div className="flex items-center gap-2">
          <Archive className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold tracking-normal">Tình trạng lớp học</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {loading
            ? 'Đang tải...'
            : `${stats?.active_classes ?? 0} lớp đang hoạt động trên tổng số ${stats?.total_classes ?? 0} lớp đã tạo. ${
                stats?.archived_classes ?? 0
              } lớp đã lưu trữ.`}
        </p>
      </section>
    </>
  )
}
