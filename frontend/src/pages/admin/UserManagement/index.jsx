import { useEffect, useState, useMemo } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  Filter,
  GraduationCap,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  UserCheck,
  UserRound,
  Users2,
  UserX,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminService } from '@/services/adminService'
import { dashboardService } from '@/services/dashboardService'
import { useAuth } from '@/context/useAuth'

function getRoleBadge(role) {
  switch (role) {
    case 'ADMIN':
      return {
        label: 'Quản trị viên',
        class: 'bg-violet-500/10 text-violet-700 border-violet-200 dark:border-violet-900/50 dark:text-violet-300',
        icon: ShieldCheck,
      }
    case 'INSTRUCTOR':
    case 'TEACHER':
      return {
        label: 'Giảng viên',
        class: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:border-blue-900/50 dark:text-blue-300',
        icon: BookOpenCheck,
      }
    case 'STUDENT':
    default:
      return {
        label: 'Học viên',
        class: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-900/50 dark:text-emerald-300',
        icon: GraduationCap,
      }
  }
}

function getAvatarColor(name = '') {
  const colors = [
    'bg-indigo-600',
    'bg-emerald-600',
    'bg-violet-600',
    'bg-amber-600',
    'bg-rose-600',
    'bg-cyan-600',
    'bg-teal-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name = '') {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

function formatDate(isoString) {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return isoString
  }
}

export function AdminUserManagementPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [dashboardStats, setDashboardStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  // Search & Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL') // ALL, STUDENT, INSTRUCTOR, ADMIN
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL, ACTIVE, INACTIVE

  // Lock / Unlock action loading state per userId
  const [actionLoadingId, setActionLoadingId] = useState(null)

  const loadUsersAndStats = async () => {
    setLoading(true)
    setError('')
    try {
      const [usersData, statsData] = await Promise.all([
        adminService.getUsers({ search: search.trim(), role: roleFilter }),
        dashboardService.getAdminDashboard().catch(() => null),
      ])
      setUsers(Array.isArray(usersData) ? usersData : [])
      if (statsData) setDashboardStats(statsData)
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách người dùng.')
    } finally {
      setLoading(false)
    }
  }

  // Load when role filter or search trigger changes
  useEffect(() => {
    loadUsersAndStats()
  }, [roleFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadUsersAndStats()
  }

  // Filter users in memory for instant responsiveness
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))

      const matchRole =
        roleFilter === 'ALL' ||
        u.role === roleFilter ||
        (roleFilter === 'INSTRUCTOR' && u.role === 'TEACHER')

      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter

      return matchSearch && matchRole && matchStatus
    })
  }, [users, search, roleFilter, statusFilter])

  // Handle Toggle User Status (Lock / Unlock)
  const handleToggleStatus = async (user) => {
    if (user.id === currentUser?.id) {
      alert('Bạn không thể khóa tài khoản của chính mình.')
      return
    }

    const isCurrentlyActive = user.status === 'ACTIVE'
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE'
    const actionText = isCurrentlyActive ? 'KHÓA' : 'MỞ KHÓA'

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn ${actionText} tài khoản của ${user.full_name || user.email}?`
    )
    if (!confirmed) return

    setActionLoadingId(user.id)
    setActionSuccess('')
    setError('')

    try {
      await adminService.updateUserStatus(user.id, newStatus)
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      )
      setActionSuccess(`Đã ${actionText.toLowerCase()} tài khoản ${user.full_name || user.email} thành công.`)
      setTimeout(() => setActionSuccess(''), 4000)
    } catch (err) {
      setError(err.message || `Không thể ${actionText.toLowerCase()} tài khoản.`)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Quick stats cards
  const roleCards = [
    {
      label: 'Tổng người dùng',
      value: dashboardStats?.total_users ?? users.length,
      icon: Users2,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    },
    {
      label: 'Học viên',
      value: dashboardStats?.total_students ?? users.filter((u) => u.role === 'STUDENT').length,
      icon: GraduationCap,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      label: 'Giảng viên',
      value: dashboardStats?.total_instructors ?? users.filter((u) => u.role === 'INSTRUCTOR' || u.role === 'TEACHER').length,
      icon: BookOpenCheck,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      label: 'Quản trị viên',
      value: dashboardStats?.total_admins ?? users.filter((u) => u.role === 'ADMIN').length,
      icon: ShieldCheck,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/40',
    },
  ]

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Admin Workspace</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Quản lý Người dùng
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Tra cứu, lọc vai trò và quản trị trạng thái kích hoạt / khóa tài khoản người dùng.
          </p>
        </div>

        <Button
          onClick={loadUsersAndStats}
          variant="outline"
          disabled={loading}
          className="self-start sm:self-auto rounded-xl gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Alerts */}
      {actionSuccess ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Role Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {roleCards.map(({ label, value, icon: Icon, color, bg }) => (
          <article
            className="rounded-2xl border border-border/80 bg-card p-5 text-card-foreground shadow-xs"
            key={label}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">{label}</p>
              <span className={`flex size-9 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`size-4.5 ${color}`} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-foreground">
              {loading ? '—' : value.toLocaleString('vi-VN')}
            </p>
          </article>
        ))}
      </div>

      {/* Main Table Card with Search & Filters */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên, email người dùng..."
              className="w-full rounded-xl border border-input bg-background pl-9.5 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </form>

          {/* Role & Status Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Vai trò:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="STUDENT">Học viên</option>
                <option value="INSTRUCTOR">Giảng viên</option>
                <option value="ADMIN">Quản trị viên</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ALL">Tất cả</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Đã khóa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground font-bold uppercase tracking-wider border-b border-border/60">
              <tr>
                <th className="px-5 py-3.5">Người dùng</th>
                <th className="px-5 py-3.5">Vai trò</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5">Ngày tham gia</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    <Loader2 className="size-6 animate-spin text-indigo-500 mx-auto mb-2" />
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    <UserX className="size-8 mx-auto mb-2 opacity-50" />
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleBadge = getRoleBadge(user.role)
                  const RoleIcon = roleBadge.icon
                  const isBlocked = user.status === 'INACTIVE'
                  const isSelf = user.id === currentUser?.id
                  const isActionLoading = actionLoadingId === user.id

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* User Info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`size-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(
                              user.full_name
                            )}`}
                          >
                            {getInitials(user.full_name)}
                          </div>
                          <div>
                            <p className="font-bold text-foreground flex items-center gap-1.5">
                              {user.full_name || 'Người dùng'}
                              {isSelf && (
                                <span className="rounded bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                                  Bạn
                                </span>
                              )}
                            </p>
                            <p className="text-muted-foreground text-[11px] mt-0.5">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${roleBadge.class}`}
                        >
                          <RoleIcon className="size-3" />
                          {roleBadge.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300">
                            <Lock className="size-3" />
                            Đã khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300">
                            <CheckCircle2 className="size-3" />
                            Hoạt động
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {formatDate(user.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        {isSelf ? (
                          <span className="text-[11px] text-muted-foreground italic">
                            Không thể khóa
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant={isBlocked ? 'outline' : 'destructive'}
                            onClick={() => handleToggleStatus(user)}
                            disabled={isActionLoading}
                            className={`rounded-xl text-xs font-semibold px-3 py-1.5 ${
                              isBlocked
                                ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300'
                                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                            }`}
                          >
                            {isActionLoading ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : isBlocked ? (
                              <>
                                <Unlock className="mr-1 size-3.5" />
                                Mở khóa
                              </>
                            ) : (
                              <>
                                <Lock className="mr-1 size-3.5" />
                                Khóa tài khoản
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-border/40 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Hiển thị <strong>{filteredUsers.length}</strong> trên tổng số <strong>{users.length}</strong> người dùng
          </span>
        </div>
      </div>
    </section>
  )
}

export default AdminUserManagementPage
