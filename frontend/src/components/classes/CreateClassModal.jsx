import { useState } from 'react'
import {
  Check,
  Copy,
  FolderPlus,
  HelpCircle,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { classService } from '@/services/classService'

const SUBJECT_SUGGESTIONS = [
  'Công nghệ thông tin',
  'Lập trình Web',
  'Thiết kế UI/UX',
  'Ngoại ngữ',
  'Kinh tế & Quản trị',
]

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function CreateClassModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    join_code: generateCode(),
  })
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegenerateCode = () => {
    setFormData((prev) => ({ ...prev, join_code: generateCode() }))
    setCopied(false)
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(formData.join_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback if clipboard API fails
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setError('')
    setFormData({
      title: '',
      subject: '',
      description: '',
      join_code: generateCode(),
    })
    onClose?.()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError('Vui lòng nhập tên lớp học.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const createdClass = await classService.createClass({
        title: formData.title.trim(),
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        join_code: formData.join_code,
      })

      setLoading(false)
      onSuccess?.(createdClass)
      handleClose()
    } catch (err) {
      setLoading(false)
      setError(
        typeof err === 'string'
          ? err
          : err.detail || err.message || 'Không thể tạo lớp học. Vui lòng thử lại.'
      )
    }
  }

  return (
    <Dialog isOpen={isOpen} maxWidth="max-w-lg" onClose={handleClose}>
      <DialogHeader className="bg-gradient-to-r from-emerald-600/10 via-emerald-500/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <FolderPlus className="size-6" />
          </div>
          <div>
            <DialogTitle>Tạo lớp học mới</DialogTitle>
            <DialogDescription>
              Tạo không gian học tập mới cho học viên của bạn.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive animate-in fade-in">
              {error}
            </div>
          )}

          {/* Tên lớp học */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80 flex items-center justify-between">
              <span>
                Tên lớp học <span className="text-destructive">*</span>
              </span>
              <span className="text-[11px] font-normal text-muted-foreground">Tối đa 255 ký tự</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: Lập trình ReactJS Nâng Cao (K15)"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium transition-all focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          {/* Môn học / Chủ đề */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
              Môn học / Chủ đề
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="VD: Công nghệ thông tin"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium transition-all focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />

            {/* Chips gợi ý */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUBJECT_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setFormData({ ...formData, subject: sug })}
                  className={`rounded-lg px-2 py-0.5 text-xs font-medium transition-all ${
                    formData.subject === sug
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Mô tả */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
              Mô tả lớp học
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Nhập thông tin giới thiệu, lịch học hoặc yêu cầu đối với học viên..."
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium transition-all focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 resize-none"
            />
          </div>

          {/* Mã tham gia lớp */}
          <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wide">
                <Sparkles className="size-3.5 text-emerald-600" />
                Mã tham gia lớp (Join Code)
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                Tự động tạo
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl bg-background border border-emerald-200 px-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-emerald-950 shadow-inner">
                {formData.join_code}
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Tạo mã mới"
                onClick={handleRegenerateCode}
                className="size-10 rounded-xl border-emerald-200 hover:bg-emerald-100/60 text-emerald-700"
              >
                <RefreshCw className="size-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCopyCode}
                className={`h-10 px-3 rounded-xl transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                    : 'border-emerald-200 hover:bg-emerald-100/60 text-emerald-800'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="mr-1.5 size-4" />
                    Đã chép!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 size-4" />
                    Sao chép
                  </>
                )}
              </Button>
            </div>

            <p className="text-[11px] text-emerald-700/80 flex items-start gap-1">
              <HelpCircle className="size-3.5 mt-0.5 shrink-0" />
              Gửi mã này cho học viên để họ có thể tự ghi danh vào lớp của bạn.
            </p>
          </div>
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Đang tạo lớp...
              </>
            ) : (
              'Tạo lớp học'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
