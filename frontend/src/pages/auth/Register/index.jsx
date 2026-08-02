import { Eye, EyeOff, GraduationCap, Lock, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { getRoleHomePath } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'

const initialValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'student',
  agreeTerms: false,
}

function validate(values) {
  const nextErrors = {}

  if (!values.fullName.trim()) {
    nextErrors.fullName = 'Please enter your full name.'
  }

  if (!values.email.trim()) {
    nextErrors.email = 'Please enter your email address.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    nextErrors.email = 'Please enter a valid email address.'
  }

  if (!values.password) {
    nextErrors.password = 'Please create a password.'
  } else if (values.password.length < 8) {
    nextErrors.password = 'Password must be at least 8 characters.'
  }

  if (!values.confirmPassword) {
    nextErrors.confirmPassword = 'Please confirm your password.'
  } else if (values.confirmPassword !== values.password) {
    nextErrors.confirmPassword = 'Passwords do not match.'
  }

  if (!values.agreeTerms) {
    nextErrors.agreeTerms = 'You must accept the terms to continue.'
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

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target
    const nextValue = type === 'checkbox' ? checked : value

    setFormValues((current) => ({ ...current, [name]: nextValue }))
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
      const res = await register({
        email: formValues.email,
        password: formValues.password,
        fullName: formValues.fullName,
        role: formValues.role,
      })
      const targetPath = getRoleHomePath(res?.user?.role)
      navigate(targetPath, { replace: true })
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Đăng ký thất bại. Vui lòng kiểm tra thông tin và thử lại.'
      setApiError(typeof msg === 'string' ? msg : 'Đăng ký thất bại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_45%),linear-gradient(135deg,_#f8fbff_0%,_#eef4ff_100%)] px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-primary p-8 text-primary-foreground sm:p-10">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15">
                <GraduationCap className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-foreground/80">New community</p>
                <h1 className="text-2xl font-semibold">Create your teaching account</h1>
              </div>
            </div>

            <div className="mt-8 space-y-4 text-sm text-primary-foreground/90">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <p className="font-medium">Why join?</p>
                <p className="mt-2 text-primary-foreground/80">Track courses, manage lessons, and keep your learners moving forward.</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <p className="font-medium">Fast onboarding</p>
                <p className="mt-2 text-primary-foreground/80">Set up your profile in minutes and start organizing classes right away.</p>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Register</p>
                <h2 className="text-2xl font-semibold tracking-normal">Sign up</h2>
              </div>
              <Link className="text-sm font-medium text-primary hover:underline" to="/login">
                I already have an account
              </Link>
            </div>

            {apiError ? (
              <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <p className="font-semibold">Đăng ký không thành công</p>
                <p className="mt-1">{apiError}</p>
              </div>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-foreground">
                  <span>Full name</span>
                  <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                    <UserRound className="size-4 text-muted-foreground" aria-hidden="true" />
                    <input
                      className="w-full bg-transparent outline-none"
                      disabled={isLoading}
                      name="fullName"
                      onChange={handleChange}
                      placeholder="Nguyen Van A"
                      type="text"
                      value={formValues.fullName}
                    />
                  </div>
                  {errors.fullName ? <p className="text-sm font-normal text-destructive">{errors.fullName}</p> : null}
                </label>

                <label className="space-y-2 text-sm font-medium text-foreground">
                  <span>Role</span>
                  <select
                    className="w-full rounded-lg border bg-background px-3 py-2 outline-none"
                    disabled={isLoading}
                    name="role"
                    onChange={handleChange}
                    value={formValues.role}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
              </div>

              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Email address</span>
                <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                  <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
                  <input
                    className="w-full bg-transparent outline-none"
                    disabled={isLoading}
                    name="email"
                    onChange={handleChange}
                    placeholder="teacher@example.com"
                    type="email"
                    value={formValues.email}
                  />
                </div>
                {errors.email ? <p className="text-sm font-normal text-destructive">{errors.email}</p> : null}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-foreground">
                  <span>Password</span>
                  <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                    <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
                    <input
                      className="w-full bg-transparent outline-none"
                      disabled={isLoading}
                      name="password"
                      onChange={handleChange}
                      placeholder="At least 8 characters"
                      type={showPassword ? 'text' : 'password'}
                      value={formValues.password}
                    />
                    <button
                      className="text-muted-foreground"
                      onClick={() => setShowPassword((current) => !current)}
                      type="button"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password ? <p className="text-sm font-normal text-destructive">{errors.password}</p> : null}
                </label>

                <label className="space-y-2 text-sm font-medium text-foreground">
                  <span>Confirm password</span>
                  <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                    <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
                    <input
                      className="w-full bg-transparent outline-none"
                      disabled={isLoading}
                      name="confirmPassword"
                      onChange={handleChange}
                      placeholder="Repeat password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formValues.confirmPassword}
                    />
                    <button
                      className="text-muted-foreground"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      type="button"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword ? <p className="text-sm font-normal text-destructive">{errors.confirmPassword}</p> : null}
                </label>
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/40 p-3 text-sm text-muted-foreground">
                <input
                  checked={formValues.agreeTerms}
                  className="mt-0.5"
                  disabled={isLoading}
                  name="agreeTerms"
                  onChange={handleChange}
                  type="checkbox"
                />
                <span>I agree to the platform terms and privacy policy.</span>
              </label>
              {errors.agreeTerms ? <p className="-mt-2 text-sm font-normal text-destructive">{errors.agreeTerms}</p> : null}

              <Button className="w-full" disabled={isLoading} type="submit">
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
