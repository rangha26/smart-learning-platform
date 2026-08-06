import { useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  KeyRound,
  Loader2,
  User,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { classService } from '@/services/classService'

export function JoinClassModal({ isOpen, onClose, onSuccess }) {
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [joinedClass, setJoinedClass] = useState(null)

  const handleInputChange = (e) => {
    // Tự động viết hoa và xóa khoảng trắng
    const val = e.target.value.toUpperCase().replace(/\s+/g, '')
    setJoinCode(val)
    if (error) setError('')
  }

  const handleClose = () => {
    setJoinCode('')
    setError('')
    setJoinedClass(null)
    onClose?.()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanedCode = joinCode.trim()
    if (!cleanedCode) {
      setError('Vui lòng nhập mã lớp học.')
      return
    }

    if (cleanedCode.length < 4) {
      setError('Mã tham gia lớp quá ngắn. Mã đúng có từ 6 đến 8 ký tự.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const classData = await classService.joinClass(cleanedCode)
      setLoading(false)
      setJoinedClass(classData)
      onSuccess?.(classData)
    } catch (err) {
      setLoading(false)
      setError(
        typeof err === 'string'
          ? err
          : err.detail || err.message || 'Mã tham gia không chính xác hoặc lớp không tồn tại.'
      )
    }
  }

  return (
    <Dialog isOpen={isOpen} maxWidth="max-w-md" onClose={handleClose}>
      <DialogHeader className="bg-gradient-to-r from-blue-600/10 via-indigo-500/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <UserPlus className="size-6" />
          </div>
          <div>
            <DialogTitle>Tham gia lớp học</DialogTitle>
            <DialogDescription>
              Nhập mã do giáo viên cấp để ghi danh vào lớp.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {!joinedClass ? (
        <form className="flex flex-1 flex-col min-h-0" onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive animate-in fade-in">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80 flex items-center justify-between">
                <span>Mã lớp học (Class Code)</span>
                <span className="text-[11px] font-normal text-muted-foreground">Ví dụ: REACT8</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  maxLength={12}
                  autoFocus
                  value={joinCode}
                  onChange={handleInputChange}
                  placeholder="NHẬP MÃ LỚP"
                  className="w-full rounded-2xl border-2 border-input bg-background px-4 py-3.5 text-center font-mono text-2xl font-black tracking-[0.25em] text-foreground transition-all uppercase placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/15"
                />
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/50 pointer-events-none" />
              </div>

              <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">💡 Lưu ý khi tham gia lớp:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
                  <li>Sử dụng tài khoản học viên chính thức của bạn.</li>
                  <li>Mã lớp bao gồm chữ cái viết hoa và chữ số.</li>
                  <li>Nếu gặp lỗi, hãy liên hệ giảng viên để cấp lại mã chính xác.</li>
                </ul>
              </div>
            </div>
          </DialogContent>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={loading || !joinCode.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Đang kiểm tra mã...
                </>
              ) : (
                'Tham gia lớp'
              )}
            </Button>
          </DialogFooter>
        </form>
      ) : (
        /* Màn hình Tham gia Thành công */
        <div className="flex flex-1 flex-col min-h-0 animate-in fade-in zoom-in-95">
          <DialogContent className="space-y-4 py-6 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
              <CheckCircle2 className="size-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-bold text-foreground">Tham gia thành công!</h4>
              <p className="text-xs text-muted-foreground">
                Bạn đã chính thức ghi danh vào lớp học này.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 text-left space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <h5 className="font-bold text-emerald-950 text-base leading-tight">
                    {joinedClass.title}
                  </h5>
                  {joinedClass.subject && (
                    <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                      {joinedClass.subject}
                    </p>
                  )}
                </div>
              </div>

              {joinedClass.instructor && (
                <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/60 text-xs text-emerald-800">
                  <User className="size-3.5 text-emerald-600" />
                  <span>
                    Giảng viên: <strong>{joinedClass.instructor.full_name}</strong>
                  </span>
                </div>
              )}
            </div>
          </DialogContent>

          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              onClick={() => {
                const classId = joinedClass?.id
                handleClose()
                if (classId) {
                  navigate(`/student/class/${classId}`)
                }
              }}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20 px-8"
            >
              Vào lớp ngay
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </DialogFooter>
        </div>
      )}
    </Dialog>
  )
}
