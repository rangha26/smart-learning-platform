import { useState, useEffect, useRef } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Image,
  Loader2,
  Paperclip,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
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
import { assignmentService } from '@/services/assignmentService'

// Helper format bytes
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Get file icon
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

function formatVietnameseDate(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return isoString
  }
}

function getDueStatus(isoString) {
  try {
    const due = new Date(isoString)
    const now = new Date()
    const diffMs = due - now
    if (diffMs < 0) {
      return { isPast: true, text: 'Đã hết hạn nộp bài', badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-200' }
    }
    const diffHours = diffMs / (1000 * 60 * 60)
    if (diffHours <= 24) {
      return { isPast: false, text: 'Sắp hết hạn (dưới 24h)', badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-200' }
    }
    const days = Math.ceil(diffHours / 24)
    return { isPast: false, text: `Còn ${days} ngày nữa`, badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' }
  } catch {
    return { isPast: false, text: 'Đang mở', badgeClass: 'bg-muted text-muted-foreground border-border' }
  }
}

export function StudentAssignmentDetailModal({
  isOpen,
  onClose,
  assignment,
  onSubmissionUpdated,
  isInstructor = false,
}) {
  const [submission, setSubmission] = useState(null)
  const [loadingSubmission, setLoadingSubmission] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const fileInputRef = useRef(null)

  // Load current submission when modal opens
  useEffect(() => {
    if (isOpen && assignment?.id) {
      let ignore = false
      async function loadSubmission() {
        setLoadingSubmission(true)
        setError('')
        setSuccessMsg('')
        setSelectedFile(null)
        try {
          const sub = await assignmentService.getMySubmission(assignment.id)
          if (!ignore) {
            setSubmission(sub)
          }
        } catch {
          if (!ignore) setSubmission(null)
        } finally {
          if (!ignore) setLoadingSubmission(false)
        }
      }
      loadSubmission()
      return () => {
        ignore = true
      }
    }
  }, [isOpen, assignment?.id])

  if (!isOpen || !assignment) return null

  const dueInfo = getDueStatus(assignment.due_date)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('Kích thước file bài làm không được vượt quá 50MB.')
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
        setError('Kích thước file bài làm không được vượt quá 50MB.')
        return
      }
      setSelectedFile(file)
      setError('')
    }
  }

  const handleTurnIn = async () => {
    if (!selectedFile) {
      setError('Vui lòng đính kèm tệp bài làm trước khi nộp.')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccessMsg('')

    try {
      const res = await assignmentService.submitAssignment(assignment.id, selectedFile)
      setSubmission(res)
      setSelectedFile(null)
      setSuccessMsg('Nộp bài tập thành công!')
      onSubmissionUpdated?.(res)
    } catch (err) {
      setError(err.message || 'Không thể nộp bài tập. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnsubmit = async () => {
    if (submission?.grade !== null && submission?.grade !== undefined) {
      setError('Bài tập đã được chấm điểm, không thể hủy nộp.')
      return
    }

    const confirmUnsubmit = window.confirm(
      'Bạn có chắc chắn muốn hủy nộp bài tập này để nộp lại file mới?'
    )
    if (!confirmUnsubmit) return

    setSubmitting(true)
    setError('')
    setSuccessMsg('')

    try {
      await assignmentService.unsubmitAssignment(assignment.id)
      setSubmission(null)
      setSelectedFile(null)
      setSuccessMsg('Đã hủy nộp bài. Bạn có thể tải lên tệp mới.')
      onSubmissionUpdated?.(null)
    } catch (err) {
      setError(err.message || 'Không thể hủy nộp bài. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  // Determine submission status badge
  const renderSubmissionBadge = () => {
    if (loadingSubmission) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Đang kiểm tra...
        </span>
      )
    }

    if (submission?.grade !== null && submission?.grade !== undefined) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
          <Award className="size-3.5" />
          Đã chấm: {submission.grade}/{assignment.max_score} điểm
        </span>
      )
    }

    if (submission) {
      if (submission.status === 'LATE') {
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle className="size-3.5" />
            Đã nộp trễ ({formatVietnameseDate(submission.submitted_at)})
          </span>
        )
      }
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="size-3.5" />
          Đã nộp đúng hạn ({formatVietnameseDate(submission.submitted_at)})
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <Clock className="size-3.5" />
        Chưa nộp bài
      </span>
    )
  }

  return (
    <Dialog isOpen={isOpen} maxWidth="max-w-3xl" onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-indigo-600/10 via-indigo-500/5 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 shrink-0">
                <BookOpen className="size-6" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate text-lg sm:text-xl">{assignment.title}</DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2 mt-1">
                  <span>Hạn nộp: <strong>{formatVietnameseDate(assignment.due_date)}</strong></span>
                  <span>•</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    Thang điểm: {assignment.max_score} điểm
                  </span>
                </DialogDescription>
              </div>
            </div>

            <div className="self-start sm:self-auto shrink-0">
              {renderSubmissionBadge()}
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <DialogContent className="space-y-6 py-5">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Yêu cầu đề bài (Problem Statement) */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <BookOpen className="size-3.5 text-indigo-500" />
                  Yêu cầu đề bài
                </h4>
                <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 text-sm text-foreground leading-relaxed whitespace-pre-line min-h-[140px]">
                  {assignment.description || 'Không có mô tả chi tiết cho bài tập này.'}
                </div>
              </div>

              {/* Tệp đề bài đính kèm từ Giáo viên */}
              {assignment.file_url && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Paperclip className="size-3.5 text-indigo-500" />
                    Tài liệu đề bài đính kèm
                  </h4>
                  <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="size-5 text-indigo-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate max-w-[200px] sm:max-w-[280px]">
                          Tài liệu đề bài
                        </p>
                        <p className="text-[11px] text-muted-foreground">Tệp do giáo viên cung cấp</p>
                      </div>
                    </div>
                    <a
                      href={assignment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-colors"
                    >
                      <Download className="size-3.5" />
                      Tải về
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Bài làm & Trạng thái nộp bài (Student Submission Box) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-indigo-500" />
                    Bài làm của bạn
                  </h4>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${dueInfo.badgeClass}`}>
                    {dueInfo.text}
                  </span>
                </div>

                {loadingSubmission ? (
                  <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <Loader2 className="size-5 animate-spin text-indigo-500" />
                    <span>Đang tải thông tin bài làm...</span>
                  </div>
                ) : submission ? (
                  /* ĐÃ NỘP BÀI */
                  <div className="space-y-3">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/50 p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-background shadow-xs shrink-0">
                          {getFileIcon(submission.file_name || submission.file_url || 'file')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">
                            {submission.file_name || 'Tệp bài làm đã nộp'}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Nộp lúc: {formatVietnameseDate(submission.submitted_at)}
                          </p>
                        </div>
                      </div>

                      {submission.file_url && (
                        <div className="mt-2.5 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/50 flex justify-end">
                          <a
                            href={submission.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                          >
                            <ExternalLink className="size-3" />
                            Xem tệp đã nộp
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Điểm số & Nhận xét nếu đã chấm */}
                    {submission.grade !== null && submission.grade !== undefined ? (
                      <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-900/50 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-muted-foreground">Điểm số đạt được:</span>
                          <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                            {submission.grade} / {assignment.max_score} điểm
                          </span>
                        </div>
                        {submission.feedback && (
                          <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-900/50">
                            <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                              Lời nhận xét của giảng viên:
                            </span>
                            <p className="text-xs text-foreground bg-background/80 p-2 rounded-lg border">
                              {submission.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Nút Hủy nộp bài (Unsubmit) */
                      !isInstructor && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleUnsubmit}
                          disabled={submitting}
                          className="w-full rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs font-semibold"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                              Đang hủy nộp...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="mr-1.5 size-3.5" />
                              Hủy nộp bài (Unsubmit)
                            </>
                          )}
                        </Button>
                      )
                    )}
                  </div>
                ) : (
                  /* CHƯA NỘP BÀI - FORM UPLOAD & TURN IN */
                  <div className="space-y-3">
                    {!selectedFile ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`group flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-all ${
                          isDragOver
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                            : 'border-border hover:border-indigo-300 hover:bg-muted/30'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileSelect}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.7z,.txt,.png,.jpg,.jpeg,.py,.js,.java,.cpp,.c,.html,.css"
                        />
                        <div className="flex size-9 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 group-hover:scale-110 transition-transform">
                          <UploadCloud className="size-4" />
                        </div>
                        <p className="mt-1.5 text-xs font-semibold text-foreground">
                          Kéo thả file bài làm hoặc{' '}
                          <span className="text-indigo-600 underline">chọn tệp</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          PDF, Word, Code, ZIP, RAR (Tối đa 50MB)
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-900/50 p-2.5 shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-background shadow-xs shrink-0">
                            {getFileIcon(selectedFile.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate max-w-[160px] sm:max-w-[200px]">
                              {selectedFile.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          disabled={submitting}
                          className="rounded-lg p-1 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 transition-colors"
                          title="Gỡ bỏ tệp này"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Nút Turn In */}
                    {!isInstructor && (
                      <Button
                        type="button"
                        onClick={handleTurnIn}
                        disabled={submitting || !selectedFile}
                        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 text-xs py-2.5 disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                            Đang tải lên bài làm...
                          </>
                        ) : (
                          <>
                            <Send className="mr-1.5 size-3.5" />
                            Nộp bài (Turn In)
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>

        {/* Footer */}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
          >
            Đóng
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  )
}

export default StudentAssignmentDetailModal
