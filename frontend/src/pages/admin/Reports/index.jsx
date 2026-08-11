import { useEffect, useState } from 'react'
import {
  Archive,
  BookOpenCheck,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  TrendingUp,
  Users2,
} from 'lucide-react'

import { dashboardService } from '@/services/dashboardService'

export function AdminReportsPage() {
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
        if (!ignore) setStats(data)
      } catch (err) {
        if (!ignore) setError(err.message || 'Không thể tải dữ liệu báo cáo.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadStats()
    return () => {
      ignore = true
    }
  }, [])

  const completionRate =
    stats && stats.total_assignments > 0
      ? Math.round((stats.total_submissions / stats.total_assignments) * 100)
      : 0

  const reportCards = [
    {
      label: 'Completion rate',
      value: loading ? '—' : `${completionRate}%`,
      detail: `${stats?.total_submissions ?? 0} bài nộp / ${stats?.total_assignments ?? 0} bài tập`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Lớp đang hoạt động',
      value: loading ? '—' : (stats?.active_classes ?? 0).toLocaleString('vi-VN'),
      detail: `${stats?.archived_classes ?? 0} lớp đã lưu trữ · ${stats?.total_classes ?? 0} tổng cộng`,
      icon: BookOpenCheck,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Tổng người dùng',
      value: loading ? '—' : (stats?.total_users ?? 0).toLocaleString('vi-VN'),
      detail: `${stats?.total_students ?? 0} học viên · ${stats?.total_instructors ?? 0} giảng viên`,
      icon: Users2,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ]

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Admin reports</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">Báo cáo hệ thống</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Tổng hợp thống kê về học viên, lớp học và tiến độ bài tập trên toàn nền tảng.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {reportCards.map(({ label, value, detail, icon: Icon, color, bg }) => (
          <article className="rounded-lg border bg-card p-5 text-card-foreground" key={label}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <span className={`flex size-8 items-center justify-center rounded-full ${bg}`}>
                <Icon className={`size-4 ${color}`} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{loading ? 'Đang tải...' : detail}</p>
          </article>
        ))}
      </div>

      {/* Breakdown block */}
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Phân bổ người dùng</h2>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-muted-foreground">Học viên</span>
              <span className="font-semibold">{loading ? '—' : (stats?.total_students ?? 0).toLocaleString('vi-VN')}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Giảng viên</span>
              <span className="font-semibold">{loading ? '—' : (stats?.total_instructors ?? 0).toLocaleString('vi-VN')}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Quản trị viên</span>
              <span className="font-semibold">{loading ? '—' : (stats?.total_admins ?? 0).toLocaleString('vi-VN')}</span>
            </li>
            <li className="flex justify-between border-t pt-2">
              <span className="font-medium">Tổng cộng</span>
              <span className="font-semibold">{loading ? '—' : (stats?.total_users ?? 0).toLocaleString('vi-VN')}</span>
            </li>
          </ul>
        </article>

        <article className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2">
            <Archive className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Trạng thái lớp học</h2>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-muted-foreground">Đang hoạt động</span>
              <span className="font-semibold text-emerald-600">{loading ? '—' : (stats?.active_classes ?? 0).toLocaleString('vi-VN')}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Đã lưu trữ</span>
              <span className="font-semibold text-muted-foreground">{loading ? '—' : (stats?.archived_classes ?? 0).toLocaleString('vi-VN')}</span>
            </li>
            <li className="flex justify-between border-t pt-2">
              <span className="font-medium">Tổng lớp học</span>
              <span className="font-semibold">{loading ? '—' : (stats?.total_classes ?? 0).toLocaleString('vi-VN')}</span>
            </li>
          </ul>
        </article>
      </div>

      {/* Assignment summary */}
      <article className="rounded-lg border bg-card p-5">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Thống kê bài tập & bài nộp</h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/40 p-4 text-center">
            <p className="text-xs text-muted-foreground">Tổng bài tập</p>
            <p className="mt-1 text-2xl font-bold">{loading ? '—' : (stats?.total_assignments ?? 0).toLocaleString('vi-VN')}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-4 text-center">
            <p className="text-xs text-muted-foreground">Tổng bài nộp</p>
            <p className="mt-1 text-2xl font-bold">{loading ? '—' : (stats?.total_submissions ?? 0).toLocaleString('vi-VN')}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4 text-center">
            <p className="text-xs text-muted-foreground">Tỉ lệ hoàn thành</p>
            <div className="flex items-center justify-center gap-1">
              <FileCheck2 className="size-4 text-emerald-600" />
              <p className="mt-1 text-2xl font-bold text-emerald-600">{loading ? '—' : `${completionRate}%`}</p>
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}
