import { useState, useEffect, useRef } from 'react'
import {
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Eye,
  FileCode,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Image,
  Layers,
  List,
  Loader2,
  Paperclip,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  FileArchive,
  Bold,
  Italic,
  Quote,
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
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { assignmentService } from '@/services/assignmentService'
import { classService } from '@/services/classService'

// Helper to format bytes to human readable
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Get appropriate file icon
function getFileIcon(filename = '') {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (['pdf'].includes(ext)) {
    return <FileText className="size-5 text-rose-500" />
  }
  if (['doc', 'docx', 'txt'].includes(ext)) {
    return <FileText className="size-5 text-blue-500" />
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileSpreadsheet className="size-5 text-emerald-500" />
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <FileArchive className="size-5 text-amber-500" />
  }
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
    return <Image className="size-5 text-violet-500" />
  }
  return <Paperclip className="size-5 text-indigo-500" />
}

export function AssignmentEditorModal({
  isOpen,
  onClose,
  onSuccess,
  initialClassId = null,
  initialClassName = '',
}) {
  const [classes, setClasses] = useState([])
  const [loadingClasses, setLoadingClasses] = useState(false)

  const [formData, setFormData] = useState({
    classId: initialClassId ? String(initialClassId) : '',
    title: '',
    description: '',
    dueDate: '',
    maxScore: 10,
  })

  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  // Initialize due date as tomorrow 23:59 by default
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const yyyy = tomorrow.getFullYear()
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0')
      const dd = String(tomorrow.getDate()).padStart(2, '0')
      const defaultDueDate = `${yyyy}-${mm}-${dd}T23:59`

      setFormData({
        classId: initialClassId ? String(initialClassId) : '',
        title: '',
        description: '',
        dueDate: defaultDueDate,
        maxScore: 10,
      })
      setSelectedFile(null)
      setError('')
      setFieldErrors({})
      setShowPreview(false)
    }
  }, [isOpen, initialClassId])

  // Load instructor classes if classId is not fixed
  useEffect(() => {
    if (isOpen && !initialClassId) {
      let ignore = false
      async function loadClasses() {
        setLoadingClasses(true)
        try {
          const list = await classService.getMyClasses()
          if (!ignore) {
            setClasses(list || [])
            if (list && list.length > 0 && !formData.classId) {
              setFormData((prev) => ({ ...prev, classId: String(list[0].id) }))
            }
          }
        } catch {
          // ignore or fallback
        } finally {
          if (!ignore) setLoadingClasses(false)
        }
      }
      loadClasses()
      return () => {
        ignore = true
      }
    }
  }, [isOpen, initialClassId])

  // Insert markdown helper into description textarea
  const insertFormatting = (prefix, suffix = '', placeholder = 'văn bản') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentText = formData.description
    const selectedText = currentText.substring(start, end) || placeholder
    const replacement = `${prefix}${selectedText}${suffix}`

    const newText =
      currentText.substring(0, start) + replacement + currentText.substring(end)
    setFormData((prev) => ({ ...prev, description: newText }))

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      )
    }, 0)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size max 50MB
      if (file.size > 50 * 1024 * 1024) {
        setError('Kích thước file không được vượt quá 50MB.')
        return
      }
      setSelectedFile(file)
      setError('')
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('Kích thước file không được vượt quá 50MB.')
        return
      }
      setSelectedFile(file)
      setError('')
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.classId) {
      errors.classId = 'Vui lòng chọn lớp học áp dụng.'
    }
    if (!formData.title.trim()) {
      errors.title = 'Vui lòng nhập tiêu đề bài tập.'
    } else if (formData.title.trim().length > 255) {
      errors.title = 'Tiêu đề không được vượt quá 255 ký tự.'
    }

    if (!formData.dueDate) {
      errors.dueDate = 'Vui lòng chọn ngày và giờ hạn nộp bài.'
    }

    const score = Number(formData.maxScore)
    if (isNaN(score) || score <= 0) {
      errors.maxScore = 'Thang điểm phải là số lớn hơn 0.'
    } else if (score > 1000) {
      errors.maxScore = 'Thang điểm không được vượt quá 1000.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const created = await assignmentService.createAssignment(formData.classId, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        due_date: formData.dueDate,
        max_score: Number(formData.maxScore),
        file: selectedFile,
      })

      setLoading(false)
      onSuccess?.(created)
      onClose?.()
    } catch (err) {
      setLoading(false)
      setError(
        typeof err === 'string'
          ? err
          : err.detail || err.message || 'Không thể tạo bài tập. Vui lòng thử lại.'
      )
    }
  }

  return (
    <Dialog isOpen={isOpen} maxWidth="max-w-2xl" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Modal Header */}
        <DialogHeader className="bg-gradient-to-r from-indigo-600/10 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <BookOpen className="size-6" />
            </div>
            <div>
              <DialogTitle>Soạn thảo & Cấu hình bài tập</DialogTitle>
              <DialogDescription>
                Tạo đề bài tập mới, thiết lập hạn nộp, thang điểm và đính kèm tài liệu đề bài.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Content */}
        <DialogContent className="space-y-5 py-4">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive flex items-center gap-2">
              <X className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Chọn Lớp học (nếu chưa cố định) */}
          {!initialClassId ? (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Lớp học áp dụng <span className="text-destructive">*</span>
              </label>
              <select
                disabled={loading || loadingClasses}
                value={formData.classId}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, classId: e.target.value }))
                  setFieldErrors((prev) => ({ ...prev, classId: '' }))
                }}
                className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                  fieldErrors.classId
                    ? 'border-destructive focus:border-destructive'
                    : 'border-input focus:border-indigo-500'
                }`}
              >
                <option value="" disabled>
                  {loadingClasses ? 'Đang tải danh sách lớp học...' : '— Chọn lớp học —'}
                </option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.title} ({cls.subject || 'Môn học'})
                  </option>
                ))}
              </select>
              {fieldErrors.classId && (
                <p className="mt-1 text-xs font-medium text-destructive">{fieldErrors.classId}</p>
              )}
            </div>
          ) : initialClassName ? (
            <div className="rounded-xl border border-border/70 bg-muted/30 px-3.5 py-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Lớp học:</span>
              <span className="text-xs font-bold text-foreground">{initialClassName}</span>
            </div>
          ) : null}

          {/* 2. Tiêu đề bài tập */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Tiêu đề bài tập <span className="text-destructive">*</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                {formData.title.length}/255
              </span>
            </div>
            <input
              type="text"
              autoFocus
              disabled={loading}
              value={formData.title}
              maxLength={255}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, title: e.target.value }))
                setFieldErrors((prev) => ({ ...prev, title: '' }))
              }}
              placeholder="Ví dụ: Bài tập lớn tuần 3 - Xây dựng API và cơ sở dữ liệu..."
              className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                fieldErrors.title
                  ? 'border-destructive focus:border-destructive'
                  : 'border-input focus:border-indigo-500'
              }`}
            />
            {fieldErrors.title && (
              <p className="mt-1 text-xs font-medium text-destructive">{fieldErrors.title}</p>
            )}
          </div>

          {/* 3. Soạn thảo Đề bài / Hướng dẫn */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Nội dung / Yêu cầu đề bài
              </label>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Eye className="size-3.5" />
                {showPreview ? 'Chỉnh sửa' : 'Xem trước'}
              </button>
            </div>

            {/* Quick Formatting Toolbar */}
            {!showPreview && (
              <div className="flex flex-wrap items-center gap-1 rounded-t-xl border border-b-0 border-input bg-muted/40 px-2.5 py-1.5">
                <button
                  type="button"
                  title="In đậm"
                  onClick={() => insertFormatting('**', '**', 'văn bản in đậm')}
                  className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Bold className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="In nghiêng"
                  onClick={() => insertFormatting('*', '*', 'văn bản in nghiêng')}
                  className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Italic className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Danh sách gạch đầu dòng"
                  onClick={() => insertFormatting('- ', '', 'Mục danh sách')}
                  className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <List className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Khối mã nguồn"
                  onClick={() => insertFormatting('```\n', '\n```', '// Code block')}
                  className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FileCode className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Trích dẫn / Ghi chú"
                  onClick={() => insertFormatting('> ', '', 'Ghi chú quan trọng')}
                  className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Quote className="size-3.5" />
                </button>
              </div>
            )}

            {/* Textarea or Markdown Preview */}
            {!showPreview ? (
              <textarea
                ref={textareaRef}
                disabled={loading}
                rows={5}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Nhập chi tiết yêu cầu đề bài, tiêu chí chấm điểm, hướng dẫn nộp bài..."
                className="w-full rounded-b-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-y"
              />
            ) : (
              <div className="min-h-[120px] rounded-xl border border-input bg-muted/20 p-3.5 text-sm text-foreground whitespace-pre-line leading-relaxed">
                {formData.description.trim() ? (
                  formData.description
                ) : (
                  <span className="text-muted-foreground italic text-xs">
                    Chưa có nội dung mô tả đề bài.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 4. Cấu hình Hạn nộp & Thang điểm (Grid 2 cột) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-xs">
            {/* DateTimePicker (Hạn nộp) */}
            <div className="md:col-span-8">
              <DateTimePicker
                value={formData.dueDate}
                onChange={(newVal) => {
                  setFormData((prev) => ({ ...prev, dueDate: newVal }))
                  setFieldErrors((prev) => ({ ...prev, dueDate: '' }))
                }}
                disabled={loading}
                error={fieldErrors.dueDate}
              />
            </div>

            {/* Thang điểm (Max Score) */}
            <div className="md:col-span-4 flex flex-col justify-between space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Thang điểm tối đa <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    max="1000"
                    step="0.5"
                    disabled={loading}
                    value={formData.maxScore}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, maxScore: e.target.value }))
                      setFieldErrors((prev) => ({ ...prev, maxScore: '' }))
                    }}
                    className={`w-full rounded-xl border bg-background px-3.5 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                      fieldErrors.maxScore
                        ? 'border-destructive focus:border-destructive'
                        : 'border-input focus:border-indigo-500'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    điểm
                  </span>
                </div>
                {fieldErrors.maxScore && (
                  <p className="mt-1 text-xs font-medium text-destructive">{fieldErrors.maxScore}</p>
                )}
              </div>

              {/* Preset score buttons */}
              <div>
                <span className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Chọn thang điểm:
                </span>
                <div className="flex items-center gap-1.5">
                  {[10, 100, 4].map((score) => (
                    <button
                      key={score}
                      type="button"
                      disabled={loading}
                      onClick={() => setFormData((prev) => ({ ...prev, maxScore: score }))}
                      className={`flex-1 rounded-lg border px-2 py-1 text-xs font-semibold transition-all ${
                        Number(formData.maxScore) === score
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'border-border/70 bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {score}đ
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Đính kèm File đề bài */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Tệp đề bài đính kèm (Tùy chọn)
            </label>

            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]'
                    : 'border-border hover:border-indigo-300 hover:bg-muted/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.7z,.txt,.png,.jpg,.jpeg"
                />
                <div className="flex size-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 group-hover:scale-110 transition-transform">
                  <UploadCloud className="size-5" />
                </div>
                <p className="mt-2 text-xs font-semibold text-foreground">
                  Kéo thả file vào đây, hoặc{' '}
                  <span className="text-indigo-600 underline underline-offset-2">chọn từ máy tính</span>
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Hỗ trợ PDF, Word, PowerPoint, Excel, ZIP, RAR, Ảnh (Tối đa 50MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-900/50 p-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-background shadow-xs shrink-0">
                    {getFileIcon(selectedFile.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate max-w-[280px] sm:max-w-[400px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removeFile}
                  disabled={loading}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 transition-colors"
                  title="Gỡ bỏ tệp này"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )}
          </div>
        </DialogContent>

        {/* Modal Footer */}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl"
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 px-5"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Đang tạo bài tập...
              </>
            ) : (
              <>
                <Plus className="mr-1.5 size-4" />
                Tạo bài tập
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}

export default AssignmentEditorModal
