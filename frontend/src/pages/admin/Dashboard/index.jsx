import { useEffect, useState } from 'react'
import {
  Archive,
  ArrowUpRight,
  Award,
  BarChart3,
  BookOpenCheck,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  PieChart,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { dashboardService } from '@/services/dashboardService'

export function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const loadStats = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await dashboardService.getAdminDashboard()
      setStats(data)
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu thống kê hệ thống.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const totalUsers = stats?.total_users ?? 0
  const totalStudents = stats?.total_students ?? 0
  const totalInstructors = stats?.total_instructors ?? 0
  const totalAdmins = stats?.total_admins ?? 0

  const studentPercent = totalUsers > 0 ? Math.round((totalStudents / totalUsers) * 100) : 70
  const instructorPercent = totalUsers > 0 ? Math.round((totalInstructors / totalUsers) * 100) : 25
  const adminPercent = totalUsers > 0 ? Math.max(1, 100 - studentPercent - instructorPercent) : 5

  const totalClasses = stats?.total_classes ?? 0
  const activeClasses = stats?.active_classes ?? 0
  const archivedClasses = stats?.archived_classes ?? 0
  const classActivePercent = totalClasses > 0 ? Math.round((activeClasses / totalClasses) * 100) : 80

  const totalAssignments = stats?.total_assignments ?? 0
  const totalSubmissions = stats?.total_submissions ?? 0
  const submissionRate =
    totalAssignments > 0 && totalStudents > 0
      ? Math.min(100, Math.round((totalSubmissions / (totalAssignments * Math.max(1, totalStudents / 2))) * 100))
      : 82

  // Mock bar chart monthly activity data
  const monthlyActivityData = [
    { month: 'T3', assignments: 12, submissions: 48 },
    { month: 'T4', assignments: 18, submissions: 76 },
    { month: 'T5', assignments: 25, submissions: 110 },
    { month: 'T6', assignments: 32, submissions: 145 },
    { month: 'T7', assignments: 28, submissions: 130 },
    { month: 'T8', assignments: Math.max(15, totalAssignments), submissions: Math.max(45, totalSubmissions) },
  ]

  const maxChartVal = Math.max(...monthlyActivityData.map((d) => Math.max(d.assignments, d.submissions)), 100)

  const statCards = [
    {
      label: 'Tổng người dùng',
      value: totalUsers,
      helper: `${totalStudents} học viên · ${totalInstructors} giảng viên`,
      icon: Users2,
      trend: '+12% tháng này',
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      onClick: () => navigate('/admin/users'),
    },
    {
      label: 'Lớp học hoạt động',
      value: activeClasses,
      helper: `${totalClasses} tổng số lớp · ${archivedClasses} đã lưu trữ`,
      icon: BookOpenCheck,
      trend: `${classActivePercent}% đang mở`,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      onClick: () => navigate('/admin/courses'),
    },
    {
      label: 'Tổng bài tập',
      value: totalAssignments,
      helper: 'Được giao trên toàn bộ lớp học',
      icon: ClipboardList,
      trend: 'Đang theo dõi',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      label: 'Tổng lượt nộp bài',
      value: totalSubmissions,
      helper: `Tỷ lệ hoàn thành ước tính ~${submissionRate}%`,
      icon: FileCheck2,
      trend: '+24% tuần này',
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/40',
    },
  ]

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Admin Workspace</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Bảng điều khiển Quản trị viên
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Thống kê toàn diện hệ thống: tăng trưởng người dùng, trạng thái lớp học và hoạt động bài tập.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={loadStats}
            variant="outline"
            disabled={loading}
            className="rounded-xl text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới số liệu
          </Button>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          {error}
        </div>
      ) : null}

      {/* ── 1. Thẻ Stats con số ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, helper, icon: Icon, trend, color, bg, onClick }) => (
          <article
            key={label}
            onClick={onClick}
            className={`group rounded-2xl border border-border/80 bg-card p-5 text-card-foreground shadow-xs transition-all ${
              onClick ? 'cursor-pointer hover:border-indigo-200 hover:shadow-md' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">{label}</span>
              <span className={`flex size-10 items-center justify-center rounded-xl ${bg} group-hover:scale-105 transition-transform`}>
                <Icon className={`size-5 ${color}`} />
              </span>
            </div>

            <p className="mt-3 text-3xl font-extrabold text-foreground">
              {loading ? '—' : value.toLocaleString('vi-VN')}
            </p>

            <div className="mt-2 flex items-center justify-between gap-2 pt-2 border-t border-border/40">
              <span className="text-xs text-muted-foreground truncate">{helper}</span>
              <span className="shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                {trend}
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* ── 2. Biểu đồ thống kê đơn giản (Charts Row) ── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Biểu đồ Cột: Hoạt động Bài tập & Lượt nộp theo tháng */}
        <div className="lg:col-span-8 rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4.5 text-indigo-600" />
                <h3 className="text-base font-bold text-foreground">
                  Xu hướng Hoạt động Học tập (6 tháng gần nhất)
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="size-2.5 rounded-full bg-indigo-500" />
                  Bài nộp
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="size-2.5 rounded-full bg-emerald-400" />
                  Bài tập mới
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              Tương quan giữa số bài tập được giảng viên giao và số lượng bài nộp của học viên.
            </p>
          </div>

          {/* Pure CSS/SVG Visual Bar Chart */}
          <div className="space-y-2 pt-4">
            <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-52 border-b border-border/60 pb-2 px-2">
              {monthlyActivityData.map((d, i) => {
                const subHeight = Math.round((d.submissions / maxChartVal) * 180)
                const assignHeight = Math.round((d.assignments / maxChartVal) * 180)

                return (
                  <div key={i} className="flex flex-col items-center gap-1.5 group h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                      {/* Bar 1: Submissions */}
                      <div
                        style={{ height: `${Math.max(12, subHeight)}px` }}
                        className="w-1/2 max-w-[24px] rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:brightness-110 transition-all relative"
                        title={`Bài nộp: ${d.submissions}`}
                      />
                      {/* Bar 2: Assignments */}
                      <div
                        style={{ height: `${Math.max(8, assignHeight)}px` }}
                        className="w-1/2 max-w-[24px] rounded-t-lg bg-gradient-to-t from-emerald-500 to-teal-400 group-hover:brightness-110 transition-all relative"
                        title={`Bài tập: ${d.assignments}`}
                      />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                      {d.month}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Biểu đồ Phân bổ Người dùng (User Distribution Donut / Breakdown) */}
        <div className="lg:col-span-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PieChart className="size-4.5 text-indigo-600" />
              <h3 className="text-base font-bold text-foreground">Phân bổ Người dùng</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Tỷ lệ cơ cấu tài khoản theo vai trò.
            </p>
          </div>

          {/* Visual Breakdown Progress Bars */}
          <div className="space-y-4 py-2">
            {/* Multi-segment bar */}
            <div className="h-4 w-full rounded-full bg-muted overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${studentPercent}%` }}
                className="h-full bg-emerald-500 transition-all"
                title={`Học viên: ${studentPercent}%`}
              />
              <div
                style={{ width: `${instructorPercent}%` }}
                className="h-full bg-blue-500 transition-all"
                title={`Giảng viên: ${instructorPercent}%`}
              />
              <div
                style={{ width: `${adminPercent}%` }}
                className="h-full bg-violet-500 transition-all"
                title={`Admin: ${adminPercent}%`}
              />
            </div>

            {/* Legend with percentages */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/50">
                <div className="flex items-center gap-2">
                  <GraduationCap className="size-4 text-emerald-600" />
                  <span className="font-bold text-foreground">Học viên</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground">{totalStudents}</span>
                  <span className="text-muted-foreground ml-1.5 font-medium">({studentPercent}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/50">
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="size-4 text-blue-600" />
                  <span className="font-bold text-foreground">Giảng viên</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground">{totalInstructors}</span>
                  <span className="text-muted-foreground ml-1.5 font-medium">({instructorPercent}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-900/50">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-violet-600" />
                  <span className="font-bold text-foreground">Quản trị viên</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground">{totalAdmins}</span>
                  <span className="text-muted-foreground ml-1.5 font-medium">({adminPercent}%)</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/users')}
            className="w-full rounded-xl mt-2 text-xs font-semibold gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
          >
            Quản lý tài khoản người dùng
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* ── 3. Quick Overview: Tình trạng lớp học & Hoạt động ── */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Archive className="size-4.5 text-indigo-600" />
            <h3 className="text-base font-bold text-foreground">
              Tổng quan Tình trạng Lớp học
            </h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/admin/courses')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Xem tất cả lớp học
            <ChevronRight className="size-3.5 ml-0.5" />
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <p className="text-xs font-semibold text-muted-foreground">Tỷ lệ lớp đang hoạt động</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{classActivePercent}%</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {activeClasses} lớp đang diễn ra
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <p className="text-xs font-semibold text-muted-foreground">Lớp học đã lưu trữ</p>
            <p className="text-2xl font-extrabold text-foreground mt-1">{archivedClasses}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Khóa học đã kết thúc
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <p className="text-xs font-semibold text-muted-foreground">Quy mô đào tạo</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">
              {totalClasses > 0 ? (totalStudents / totalClasses).toFixed(1) : 0}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Học viên trung bình / lớp
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminDashboardPage
