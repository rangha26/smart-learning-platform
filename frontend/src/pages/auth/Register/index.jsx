import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpenCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Info,
  Lock,
  Mail,
  Sparkles,
  UserRound,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getRoleHomePath } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'

const initialValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'student', // Chỉ cho phép 'student' hoặc 'teacher'
  agreeTerms: false,
}

function validate(values) {
  const nextErrors = {}

  if (!values.fullName.trim()) {
    nextErrors.fullName = 'Vui lòng nhập họ và tên của bạn.'
  }

  if (!values.email.trim()) {
    nextErrors.email = 'Vui lòng nhập địa chỉ email.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    nextErrors.email = 'Định dạng email không hợp lệ.'
  }

  if (!values.password) {
    nextErrors.password = 'Vui lòng tạo mật khẩu.'
  } else if (values.password.length < 8) {
    nextErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự.'
  }

  if (!values.confirmPassword) {
    nextErrors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu.'
  } else if (values.confirmPassword !== values.password) {
    nextErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.'
  }

  if (!values.agreeTerms) {
    nextErrors.agreeTerms = 'Bạn cần đồng ý với Điều khoản dịch vụ để đăng ký.'
  }

  return nextErrors
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formValues, setFormValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const handleChange = (name, value) => {
    setFormValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }))
    }
    if (apiError) {
      setApiError('')
    }
  }

  const handleInputChange = (e) => {
    const { name, type, value, checked } = e.target
    handleChange(name, type === 'checkbox' ? checked : value)
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
      const res = await register({
        email: formValues.email.trim(),
        password: formValues.password,
        fullName: formValues.fullName.trim(),
        role: formValues.role,
      })
      const targetPath = getRoleHomePath(res?.user?.role)
      navigate(targetPath, { replace: true })
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin và thử lại.'
      setApiError(typeof msg === 'string' ? msg : 'Đăng ký thất bại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_45%),linear-gradient(135deg,_#f8fbff_0%,_#eef4ff_100%)] px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left Visual Banner */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 p-8 text-white sm:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xs">
                  <GraduationCap className="size-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                    Smart Learning Platform
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Tạo tài khoản mới</h1>
                </div>
              </div>

              <div className="mt-8 space-y-4 text-sm text-blue-50/90">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                  <p className="font-semibold text-white flex items-center gap-2">
                    <Sparkles className="size-4 text-blue-200" />
                    Không gian học tập tích hợp
                  </p>
                  <p className="mt-1.5 text-xs text-blue-100/90 leading-relaxed">
                    Tham gia các lớp học trực tuyến, nộp bài tập đúng hạn và theo dõi lộ trình học tập bài bản.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                  <p className="font-semibold text-white flex items-center gap-2">
                    <BookOpenCheck className="size-4 text-blue-200" />
                    Dành cho Giáo viên & Học viên
                  </p>
                  <p className="mt-1.5 text-xs text-blue-100/90 leading-relaxed">
                    Dễ dàng tạo lớp, quản lý sinh viên hoặc gia nhập lớp học chỉ với 1 mã tham gia ngẫu nhiên.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-blue-400/30 text-xs text-blue-200">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-bold text-white underline hover:text-blue-100">
                Đăng nhập ngay
              </Link>
            </div>
          </div>

          {/* Right Form Area */}
          <div className="p-8 sm:p-10 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Đăng ký</p>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Bắt đầu học tập</h2>
              </div>
            </div>

            {apiError && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive">
                {apiError}
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              {/* Lựa chọn vai trò (Chỉ Học viên & Giáo viên - KHÔNG có Admin) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80 flex items-center justify-between">
                  <span>Bạn tham gia với vai trò <span className="text-destructive">*</span></span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleChange('role', 'student')}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                      formValues.role === 'student'
                        ? 'border-blue-600 bg-blue-50/60 font-semibold text-blue-950 shadow-xs'
                        : 'border-border/70 bg-background text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <div className={`flex size-9 items-center justify-center rounded-xl ${
                      formValues.role === 'student' ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      <GraduationCap className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-tight">Học viên</p>
                      <p className="text-[11px] font-normal text-muted-foreground">Tham gia lớp & làm bài</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleChange('role', 'teacher')}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                      formValues.role === 'teacher'
                        ? 'border-indigo-600 bg-indigo-50/60 font-semibold text-indigo-950 shadow-xs'
                        : 'border-border/70 bg-background text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <div className={`flex size-9 items-center justify-center rounded-xl ${
                      formValues.role === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      <BookOpenCheck className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-tight">Giảng viên</p>
                      <p className="text-[11px] font-normal text-muted-foreground">Tạo lớp & giảng dạy</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Họ và tên */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                  Họ và tên <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border bg-background px-3.5 py-2.5 transition-all focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20">
                  <UserRound className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  <input
                    className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/60"
                    disabled={isLoading}
                    name="fullName"
                    onChange={handleInputChange}
                    placeholder="VD: Nguyễn Văn A"
                    type="text"
                    value={formValues.fullName}
                  />
                </div>
                {errors.fullName && <p className="text-xs font-medium text-destructive">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                  Địa chỉ Email <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border bg-background px-3.5 py-2.5 transition-all focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20">
                  <Mail className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  <input
                    className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/60"
                    disabled={isLoading}
                    name="email"
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    type="email"
                    value={formValues.email}
                  />
                </div>
                {errors.email && <p className="text-xs font-medium text-destructive">{errors.email}</p>}
              </div>

              {/* Grid Mật khẩu & Xác nhận */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                    Mật khẩu <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border bg-background px-3.5 py-2.5 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20">
                    <Lock className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                    <input
                      className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/60"
                      disabled={isLoading}
                      name="password"
                      onChange={handleInputChange}
                      placeholder="Ít nhất 8 ký tự"
                      type={showPassword ? 'text' : 'password'}
                      value={formValues.password}
                    />
                    <button
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((c) => !c)}
                      type="button"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs font-medium text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                    Xác nhận mật khẩu <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border bg-background px-3.5 py-2.5 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20">
                    <Lock className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                    <input
                      className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/60"
                      disabled={isLoading}
                      name="confirmPassword"
                      onChange={handleInputChange}
                      placeholder="Nhập lại mật khẩu"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formValues.confirmPassword}
                    />
                    <button
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword((c) => !c)}
                      type="button"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs font-medium text-destructive">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Điều khoản */}
              <div className="space-y-1">
                <label className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground cursor-pointer">
                  <input
                    checked={formValues.agreeTerms}
                    className="mt-0.5 rounded border-border"
                    disabled={isLoading}
                    name="agreeTerms"
                    onChange={handleInputChange}
                    type="checkbox"
                  />
                  <span>Tôi đồng ý với các **Điều khoản dịch vụ** và **Chính sách bảo mật** của Smart Learning.</span>
                </label>
                {errors.agreeTerms && <p className="text-xs font-medium text-destructive pl-1">{errors.agreeTerms}</p>}
              </div>

              <Button
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20 rounded-xl"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản ngay'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
