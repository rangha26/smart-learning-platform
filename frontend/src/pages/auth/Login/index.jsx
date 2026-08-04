import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getRoleHomePath } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'

const initialValues = {
  email: '',
  password: '',
}

function validate(values) {
  const nextErrors = {}

  if (!values.email.trim()) {
    nextErrors.email = 'Vui lòng nhập địa chỉ email của bạn.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    nextErrors.email = 'Địa chỉ email không đúng định dạng.'
  }

  if (!values.password) {
    nextErrors.password = 'Vui lòng nhập mật khẩu.'
  }

  return nextErrors
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formValues, setFormValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }))
    }
    if (apiError) {
      setApiError('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(formValues)
    setErrors(nextErrors)
    setApiError('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsLoading(true)
    try {
      const res = await login(formValues.email.trim(), formValues.password)
      const targetPath = getRoleHomePath(res?.user?.role)
      navigate(targetPath, { replace: true })
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.'
      setApiError(typeof msg === 'string' ? msg : 'Đăng nhập thất bại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_45%),linear-gradient(135deg,_#f7fefb_0%,_#ecfdf5_100%)] px-4 py-10">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          {/* Banner trái */}
          <div className="bg-emerald-600 p-8 text-emerald-50 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xs">
                  <Sparkles className="size-5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                    Smart Learning Platform
                  </p>
                  <h1 className="text-2xl font-bold text-white">Chào mừng trở lại</h1>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-5 text-sm text-emerald-50/90 space-y-2">
                <p className="font-semibold text-white">Tiếp tục hành trình học tập</p>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  Xem bài giảng trực tuyến, quản lý lịch học, làm bài tập và trao đổi trực tiếp với giảng viên.
                </p>
              </div>
            </div>
          </div>

          {/* Khối Form bên phải */}
          <div className="p-8 sm:p-10 flex flex-col justify-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Đăng nhập</p>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Truy cập tài khoản</h2>
            </div>

            {apiError ? (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive">
                {apiError}
              </div>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                  Địa chỉ Email <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border bg-background px-3.5 py-2.5 transition-all focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20">
                  <Mail className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  <input
                    className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/60"
                    disabled={isLoading}
                    name="email"
                    onChange={handleChange}
                    placeholder="you@example.com"
                    type="email"
                    value={formValues.email}
                  />
                </div>
                {errors.email ? <p className="text-xs font-medium text-destructive">{errors.email}</p> : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                  Mật khẩu <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border bg-background px-3.5 py-2.5 transition-all focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20">
                  <Lock className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  <input
                    className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/60"
                    disabled={isLoading}
                    name="password"
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu của bạn"
                    type={showPassword ? 'text' : 'password'}
                    value={formValues.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password ? <p className="text-xs font-medium text-destructive">{errors.password}</p> : null}
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                  <input className="rounded border-border" type="checkbox" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <Link className="font-semibold text-emerald-600 hover:underline" to="/forgot-password">
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20 rounded-xl"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Bạn chưa có tài khoản?{' '}
              <Link className="font-semibold text-emerald-700 hover:underline" to="/register">
                Tạo tài khoản mới ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
