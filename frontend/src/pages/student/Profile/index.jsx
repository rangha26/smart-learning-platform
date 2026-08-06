import { useState } from 'react'
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  LogOut,
  Mail,
  Shield,
  User,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/useAuth'

function formatDate(isoString) {
  if (!isoString) return '—'
  try {
    return new Date(isoString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return isoString
  }
}

function Avatar({ name, size = 'lg' }) {
  const initials = (name || 'S')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  const sizeClass = size === 'lg' ? 'size-24 text-3xl' : 'size-10 text-sm'

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 font-bold text-white shadow-lg shadow-emerald-500/30`}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/60 last:border-0">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate font-medium text-foreground">{value || '—'}</p>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color = 'emerald' }) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
  }
  return (
    <div className="rounded-2xl border bg-card p-5 text-center shadow-sm">
      <div
        className={`mx-auto mb-3 flex size-10 items-center justify-center rounded-xl ${colorMap[color]}`}
      >
        <Icon className="size-5" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  )
}

export function StudentProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleBadge =
    user?.role === 'STUDENT'
      ? { label: 'Học viên', color: 'bg-emerald-100 text-emerald-800' }
      : user?.role === 'INSTRUCTOR'
        ? { label: 'Giảng viên', color: 'bg-blue-100 text-blue-800' }
        : { label: user?.role ?? '—', color: 'bg-muted text-muted-foreground' }

  const statusBadge =
    user?.status === 'ACTIVE'
      ? { label: 'Đang hoạt động', icon: CheckCircle2, color: 'text-emerald-600' }
      : { label: 'Không hoạt động', icon: Shield, color: 'text-muted-foreground' }

  return (
    <section className="space-y-6">
      {/* Page title */}
      <div>
        <p className="text-sm font-medium text-muted-foreground">Student portal</p>
        <h1 className="text-3xl font-semibold tracking-tight">My Profile</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* ── Left: Identity card ─────────────────────────── */}
        <div className="space-y-4">
          {/* Avatar + name card */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm text-center">
            <div className="flex justify-center">
              <Avatar name={user?.full_name} size="lg" />
            </div>

            <h2 className="mt-4 text-xl font-bold text-foreground">
              {user?.full_name || 'Learner'}
            </h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>

            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <span
                className={`rounded-full px-3 py-0.5 text-xs font-semibold ${roleBadge.color}`}
              >
                {roleBadge.label}
              </span>
              <span
                className={`flex items-center gap-1 text-xs font-medium ${statusBadge.color}`}
              >
                <statusBadge.icon className="size-3.5" />
                {statusBadge.label}
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
              Thành viên từ{' '}
              <span className="font-semibold text-foreground">
                {formatDate(user?.created_at)}
              </span>
            </div>
          </div>

          {/* Quick action */}
          <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
            <button
              id="profile-goto-learning-btn"
              onClick={() => navigate('/student/learning')}
              className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium hover:bg-muted/50 transition-colors border-b border-border/60"
            >
              <span className="flex items-center gap-2.5">
                <BookOpen className="size-4 text-emerald-600" />
                My Learning
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
            <button
              id="profile-goto-home-btn"
              onClick={() => navigate('/student')}
              className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <GraduationCap className="size-4 text-emerald-600" />
                Dashboard
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* ── Right: Detail + actions ─────────────────────── */}
        <div className="space-y-4">
          {/* Account info */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="mb-1 text-base font-semibold">Thông tin tài khoản</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Thông tin cơ bản được lưu trong hệ thống.
            </p>

            <div>
              <InfoRow icon={User} label="Họ và tên" value={user?.full_name} />
              <InfoRow icon={Mail} label="Email" value={user?.email} />
              <InfoRow icon={Shield} label="Vai trò" value={roleBadge.label} />
              <InfoRow icon={Calendar} label="Ngày tham gia" value={formatDate(user?.created_at)} />
            </div>
          </div>

          {/* Danger zone – Logout */}
          <div className="rounded-2xl border border-destructive/20 bg-card p-6 shadow-sm">
            <h3 className="mb-1 text-base font-semibold text-destructive">Đăng xuất</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Phiên đăng nhập hiện tại sẽ bị kết thúc. Bạn cần đăng nhập lại để tiếp tục.
            </p>

            {showLogoutConfirm ? (
              <div className="flex items-center gap-3">
                <Button
                  id="profile-confirm-logout-btn"
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-1.5"
                >
                  <LogOut className="size-3.5" />
                  Xác nhận đăng xuất
                </Button>
                <Button
                  id="profile-cancel-logout-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Hủy
                </Button>
              </div>
            ) : (
              <Button
                id="profile-logout-btn"
                variant="outline"
                size="sm"
                onClick={() => setShowLogoutConfirm(true)}
                className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
              >
                <LogOut className="size-3.5" />
                Đăng xuất
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
