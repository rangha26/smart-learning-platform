import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authService } from '@/services/authService'

function extractApiErrorMessage(err, fallback) {
  return (
    err.response?.data?.error?.message ||
    err.response?.data?.detail ||
    err.response?.data?.message ||
    fallback
  )
}

export function ForgotPasswordPage() {
  const navigate = useNavigate()

  // Steps: 'request' (nhap email) | 'sent' (nhap OTP) | 'reset' (mat khau moi) | 'success'
  const [step, setStep] = useState('request')

  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [resetSessionToken, setResetSessionToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [emailError, setEmailError] = useState('')
  const [otpError, setOtpError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [apiError, setApiError] = useState('')

  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  // Countdown timer for resending OTP
  useEffect(() => {
    let interval = null
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [resendTimer])

  // Password Strength Calculation
  const hasMinLength = newPassword.length >= 8
  const hasUpper = /[A-Z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const strengthScore = [hasMinLength, hasUpper, hasNumber].filter(Boolean).length

  // Buoc 1: Gui yeu cau OTP
  const handleRequestSubmit = async (e) => {
    e.preventDefault()
    setEmailError('')
    setApiError('')

    if (!email.trim()) {
      setEmailError('Vui lòng nhập địa chỉ email của bạn.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Định dạng email không hợp lệ.')
      return
    }

    setLoading(true)
    try {
      await authService.forgotPassword(email.trim())
      setLoading(false)
      setOtpCode('')
      setStep('sent')
      setResendTimer(60)
    } catch (err) {
      setLoading(false)
      setApiError(extractApiErrorMessage(err, 'Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại.'))
    }
  }

  // Gui lai ma OTP
  const handleResend = async () => {
    if (resendTimer > 0) return
    setLoading(true)
    setApiError('')
    try {
      await authService.forgotPassword(email.trim())
      setLoading(false)
      setOtpCode('')
      setResendTimer(60)
    } catch (err) {
      setLoading(false)
      setApiError(extractApiErrorMessage(err, 'Gửi lại thất bại. Vui lòng thử lại.'))
    }
  }

  // Buoc 2: Xac thuc OTP -> nhan reset_session_token
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault()
    setOtpError('')
    setApiError('')

    if (!/^\d{6}$/.test(otpCode)) {
      setOtpError('Mã OTP phải gồm đúng 6 chữ số.')
      return
    }

    setLoading(true)
    try {
      const data = await authService.verifyOtp({ email: email.trim(), otpCode })
      setLoading(false)
      setResetSessionToken(data.reset_session_token)
      setStep('reset')
    } catch (err) {
      setLoading(false)
      setApiError(extractApiErrorMessage(err, 'Mã OTP không đúng hoặc đã hết hạn.'))
    }
  }

  // Buoc 3: Dat mat khau moi bang reset_session_token
  const handleResetSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setApiError('')

    if (newPassword.length < 8) {
      setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không trùng khớp.')
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword({ resetSessionToken, newPassword })
      setLoading(false)
      setStep('success')
    } catch (err) {
      setLoading(false)
      setApiError(extractApiErrorMessage(err, 'Không thể đặt lại mật khẩu. Phiên xác thực có thể đã hết hạn, vui lòng thực hiện lại từ đầu.'))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_45%),linear-gradient(135deg,_#f7fefb_0%,_#ecfdf5_100%)] px-4 py-10">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          {/* Visual Left Banner */}
          <div className="bg-emerald-600 p-8 text-emerald-50 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xs">
                  <ShieldCheck className="size-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                    Smart Learning Security
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Khôi phục mật khẩu</h1>
                </div>
              </div>

              <div className="mt-8 space-y-4 text-emerald-50/90 text-sm">
                <p className="leading-relaxed">
                  Đừng lo lắng! Chúng tôi sẽ giúp bạn lấy lại quyền truy cập vào tài khoản học tập của mình một cách nhanh chóng và an toàn.
                </p>

                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Sparkles className="size-4 text-emerald-300" />
                    Mẹo bảo mật tài khoản
                  </div>
                  <ul className="text-xs space-y-1.5 text-emerald-100/90 pl-1 list-disc list-inside">
                    <li>Mã OTP gồm 6 chữ số, có hiệu lực trong 10 phút.</li>
                    <li>Sử dụng mật khẩu có từ 8 ký tự trở lên.</li>
                    <li>Không chia sẻ mã OTP với người khác.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-emerald-500/40 text-xs text-emerald-200">
              Cần trợ giúp trực tiếp?{' '}
              <a href="#" className="font-semibold text-white underline hover:text-emerald-100">
                Liên hệ hỗ trợ 24/7
              </a>
            </div>
          </div>

          {/* Form Content Right Container */}
          <div className="p-8 sm:p-10 flex flex-col justify-center">
            {/* Top Navigation Back button */}
            <div className="mb-6">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-emerald-600 transition-colors"
              >
                <ArrowLeft className="size-4" />
                Quay lại trang Đăng nhập
              </Link>
            </div>

            {/* STEP 1: REQUEST FORM */}
            {step === 'request' && (
              <div className="animate-in fade-in zoom-in-95">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Quên mật khẩu?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nhập địa chỉ email đăng ký của bạn. Chúng tôi sẽ gửi mã OTP để xác thực.
                  </p>
                </div>

                {apiError && (
                  <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
                    {apiError}
                  </div>
                )}

                <form className="mt-6 space-y-4" onSubmit={handleRequestSubmit} noValidate>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                      Địa chỉ Email
                    </label>
                    <div className="flex items-center gap-2.5 rounded-xl border bg-background px-3.5 py-3 transition-all focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20">
                      <Mail className="size-5 text-muted-foreground shrink-0" />
                      <input
                        type="email"
                        required
                        disabled={loading}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (emailError) setEmailError('')
                          if (apiError) setApiError('')
                        }}
                        placeholder="you@example.com"
                        className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/60"
                      />
                    </div>
                    {emailError && <p className="text-xs font-medium text-destructive">{emailError}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20 rounded-xl"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="size-4 animate-spin" />
                        Đang gửi yêu cầu...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Send className="size-4" />
                        Gửi mã OTP
                      </span>
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 'sent' && (
              <div className="animate-in fade-in zoom-in-95 space-y-5">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <Mail className="size-7 animate-pulse" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground">Đã gửi mã OTP!</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    Chúng tôi đã gửi mã OTP gồm 6 chữ số tới địa chỉ{' '}
                    <strong className="text-foreground">{email}</strong>. Mã có hiệu lực trong 10 phút.
                  </p>
                </div>

                {apiError && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
                    {apiError}
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleVerifyOtpSubmit} noValidate>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
                    <p className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                      <KeyRound className="size-4 text-emerald-600" />
                      Nhập mã OTP để tiếp tục:
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      disabled={loading}
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                        if (otpError) setOtpError('')
                        if (apiError) setApiError('')
                      }}
                      className="w-full rounded-xl border border-emerald-300 bg-background px-3.5 py-2.5 text-center font-mono text-lg font-bold tracking-[0.4em] text-emerald-950 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                    />
                    {otpError && <p className="text-xs font-medium text-destructive">{otpError}</p>}
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <Button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20 rounded-xl"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="size-4 animate-spin" />
                          Đang xác thực...
                        </span>
                      ) : (
                        'Xác thực mã OTP'
                      )}
                    </Button>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground">Chưa nhận được mã?</span>
                      <button
                        type="button"
                        disabled={resendTimer > 0 || loading}
                        onClick={handleResend}
                        className="text-xs font-semibold text-emerald-600 hover:underline disabled:opacity-50 disabled:no-underline"
                      >
                        {resendTimer > 0 ? `Gửi lại sau (${resendTimer}s)` : 'Gửi lại mã OTP'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: RESET PASSWORD FORM */}
            {step === 'reset' && (
              <div className="animate-in fade-in zoom-in-95">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Tạo mật khẩu mới</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nhập mật khẩu mới cho tài khoản <strong className="text-foreground">{email}</strong>.
                  </p>
                </div>

                {apiError && (
                  <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
                    {apiError}
                  </div>
                )}

                <form className="mt-6 space-y-4" onSubmit={handleResetSubmit} noValidate>
                  {/* Mật khẩu mới */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                      Mật khẩu mới
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border bg-background px-3.5 py-2.5 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20">
                      <Lock className="size-4 text-muted-foreground" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        disabled={loading}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Xac nhan mat khau */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border bg-background px-3.5 py-2.5 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20">
                      <Lock className="size-4 text-muted-foreground" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        disabled={loading}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Indicator Bar */}
                  {newPassword && (
                    <div className="rounded-xl bg-muted/40 p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Độ mạnh mật khẩu:</span>
                        <span className="font-semibold text-foreground">
                          {strengthScore === 3
                            ? '🟢 Mạnh'
                            : strengthScore === 2
                            ? '🟡 Trung bình'
                            : '🔴 Yếu'}
                        </span>
                      </div>
                      <div className="flex gap-1.5 h-1.5 w-full">
                        <div
                          className={`h-full flex-1 rounded-full ${
                            strengthScore >= 1 ? 'bg-destructive' : 'bg-muted'
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full ${
                            strengthScore >= 2 ? 'bg-amber-500' : 'bg-muted'
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full ${
                            strengthScore === 3 ? 'bg-emerald-600' : 'bg-muted'
                          }`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground pt-1">
                        <span className={hasMinLength ? 'text-emerald-700 font-semibold' : ''}>
                          {hasMinLength ? '✓' : '•'} Tối thiểu 8 ký tự
                        </span>
                        <span className={hasUpper ? 'text-emerald-700 font-semibold' : ''}>
                          {hasUpper ? '✓' : '•'} Chữ viết hoa (A-Z)
                        </span>
                        <span className={hasNumber ? 'text-emerald-700 font-semibold' : ''}>
                          {hasNumber ? '✓' : '•'} Chứa chữ số (0-9)
                        </span>
                      </div>
                    </div>
                  )}

                  {passwordError && <p className="text-xs font-medium text-destructive">{passwordError}</p>}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20 rounded-xl"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="size-4 animate-spin" />
                        Đang lưu mật khẩu...
                      </span>
                    ) : (
                      'Cập nhật mật khẩu'
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* STEP 4: SUCCESS STATE */}
            {step === 'success' && (
              <div className="animate-in fade-in zoom-in-95 text-center space-y-5 py-4">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
                  <CheckCircle2 className="size-10" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground">Đặt lại mật khẩu thành công!</h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Mật khẩu của bạn đã được cập nhật an toàn. Tất cả phiên đăng nhập cũ đã bị thu hồi. Bây giờ bạn có thể sử dụng mật khẩu mới để đăng nhập.
                  </p>
                </div>

                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20 rounded-xl"
                >
                  Đăng nhập ngay
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
