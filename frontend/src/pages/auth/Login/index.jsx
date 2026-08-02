import { Lock, Mail, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

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
    nextErrors.email = 'Please enter your email.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    nextErrors.email = 'Please enter a valid email.'
  }

  if (!values.password) {
    nextErrors.password = 'Please enter your password.'
  }

  return nextErrors
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formValues, setFormValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
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
      const res = await login(formValues.email, formValues.password)
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
          <div className="bg-emerald-600 p-8 text-emerald-50 sm:p-10">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15">
                <Sparkles className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-100">Welcome back</p>
                <h1 className="text-2xl font-semibold">Access your learning space</h1>
              </div>
            </div>
            <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-5 text-sm text-emerald-50/90">
              <p className="font-medium">Continue where you left off</p>
              <p className="mt-2">Review upcoming lessons, manage assignments, and keep your study plan on track.</p>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Login</p>
              <h2 className="text-2xl font-semibold tracking-normal">Sign in</h2>
            </div>

            {apiError ? (
              <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <p className="font-semibold">Đăng nhập không thành công</p>
                <p className="mt-1">{apiError}</p>
              </div>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Email address</span>
                <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                  <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
                  <input
                    className="w-full bg-transparent outline-none"
                    disabled={isLoading}
                    name="email"
                    onChange={handleChange}
                    placeholder="you@example.com"
                    type="email"
                    value={formValues.email}
                  />
                </div>
                {errors.email ? <p className="text-sm font-normal text-destructive">{errors.email}</p> : null}
              </label>

              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Password</span>
                <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                  <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
                  <input
                    className="w-full bg-transparent outline-none"
                    disabled={isLoading}
                    name="password"
                    onChange={handleChange}
                    placeholder="Enter your password"
                    type="password"
                    value={formValues.password}
                  />
                </div>
                {errors.password ? <p className="text-sm font-normal text-destructive">{errors.password}</p> : null}
              </label>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input className="rounded border-border" type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a className="font-medium text-emerald-600 hover:underline" href="#">
                  Forgot password?
                </a>
              </div>

              <Button className="w-full" disabled={isLoading} type="submit">
                {isLoading ? 'Signing in...' : 'Login'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New here?{' '}
              <Link className="font-medium text-primary hover:underline" to="/register">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
