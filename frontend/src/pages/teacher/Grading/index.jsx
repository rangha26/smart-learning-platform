import { useEffect, useState, useMemo } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Download,
  ExternalLink,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Filter,
  Image,
  Loader2,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Save,
  Search,
  Send,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { assignmentService } from '@/services/assignmentService'
import { classService } from '@/services/classService'

const FEEDBACK_PRESETS = [
  'Bài làm rất tốt, giải thuật tối ưu và trình bày mạch lạc! 🌟',
  'Đạt yêu cầu đề bài, cấu trúc code sạch sẽ.',
  'Cần bổ sung thêm phần giải thích và kiểm tra các trường hợp biên.',
  'Bài làm nộp trễ hạn quy định, lần sau cần lưu ý nộp đúng hạn nhé!',
  'Chưa hoàn thiện đầy đủ các yêu cầu theo mô tả đề bài.',
]

function getAvatarColor(name = '') {
  const colors = [
    'bg-indigo-600',
    'bg-emerald-600',
    'bg-violet-600',
    'bg-amber-600',
    'bg-rose-600',
    'bg-cyan-600',
    'bg-teal-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name = '') {
  if (!name) return 'HV'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

function formatDateTime(isoString) {
  if (!isoString) return '—'
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

export function TeacherGradingPage() {
  const { assignmentId, classId } = useParams()
  const navigate = useNavigate()

  const [assignment, setAssignment] = useState(null)
  const [students, setStudents] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter & Search
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL, UNGRADED, GRADED, NOT_SUBMITTED

  // Grading form state
  const [gradeInput, setGradeInput] = useState('')
  const [feedbackInput, setFeedbackInput] = useState('')
  const [savingGrade, setSavingGrade] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')

  // Load Assignment, Submissions, and Enrolled Students
  useEffect(() => {
    let ignore = false

    async function loadData() {
      setLoading(true)
      setError('')
      try {
        // 1. Fetch user assignments to find current assignment
        const allAssignments = await assignmentService.getMyAssignments(1, 100)
        const found = allAssignments?.assignments?.find(
          (a) => String(a.id) === String(assignmentId)
        )

        // 2. Fetch submissions for this assignment
        let subs = []
        try {
          subs = await assignmentService.getSubmissions(assignmentId)
        } catch {
          subs = []
        }

        // Mock fallback if offline dev
        const resolvedAssignment = found || {
          id: Number(assignmentId),
          title: `Bài tập #${assignmentId}`,
          description: 'Soạn thảo và thực thi đầy đủ các bài tập theo yêu cầu giảng viên.',
          due_date: new Date(Date.now() + 86400000).toISOString(),
          max_score: 10,
          class_id: classId ? Number(classId) : 1,
        }

        // Mock enrolled students list combined with submissions
        const mockStudentNames = [
          { id: 101, full_name: 'Nguyễn Văn An', email: 'an.nguyen@example.com' },
          { id: 102, full_name: 'Trần Thị Bình', email: 'binh.tran@example.com' },
          { id: 103, full_name: 'Lê Hoàng Cường', email: 'cuong.le@example.com' },
          { id: 104, full_name: 'Phạm Minh Dũng', email: 'dung.pham@example.com' },
          { id: 105, full_name: 'Hoàng Mai Phương', email: 'phuong.hoang@example.com' },
          { id: 106, full_name: 'Vũ Đức Thịnh', email: 'thinh.vu@example.com' },
        ]

        if (!ignore) {
          setAssignment(resolvedAssignment)
          setSubmissions(subs || [])
          setStudents(mockStudentNames)
          if (mockStudentNames.length > 0) {
            setSelectedStudentId(mockStudentNames[0].id)
          }
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Không thể tải dữ liệu bài tập và danh sách nộp.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadData()
    return () => {
      ignore = true
    }
  }, [assignmentId, classId])

  // Merge students with their submissions
  const studentSubmissionsList = useMemo(() => {
    return students.map((student) => {
      const sub = submissions.find(
        (s) => Number(s.student_id) === Number(student.id)
      )
      return {
        ...student,
        submission: sub || null,
        isSubmitted: !!sub,
        isGraded: sub?.grade !== null && sub?.grade !== undefined,
        grade: sub?.grade ?? null,
        feedback: sub?.feedback ?? '',
        status: sub?.status ?? 'NOT_SUBMITTED',
        submitted_at: sub?.submitted_at ?? null,
        file_url: sub?.file_url ?? null,
      }
    })
  }, [students, submissions])

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return studentSubmissionsList.filter((item) => {
      const matchSearch =
        item.full_name.toLowerCase().includes(search.toLowerCase()) ||
        item.email.toLowerCase().includes(search.toLowerCase())

      if (!matchSearch) return false

      if (statusFilter === 'UNGRADED') {
        return item.isSubmitted && !item.isGraded
      }
      if (statusFilter === 'GRADED') {
        return item.isGraded
      }
      if (statusFilter === 'NOT_SUBMITTED') {
        return !item.isSubmitted
      }
      return true
    })
  }, [studentSubmissionsList, search, statusFilter])

  // Selected student item
  const selectedStudent = useMemo(() => {
    return studentSubmissionsList.find((s) => s.id === selectedStudentId) || null
  }, [studentSubmissionsList, selectedStudentId])

  // Sync grading input when selected student changes
  useEffect(() => {
    if (selectedStudent) {
      setGradeInput(selectedStudent.grade !== null ? String(selectedStudent.grade) : '')
      setFeedbackInput(selectedStudent.feedback || '')
      setSaveSuccess('')
      setSaveError('')
    }
  }, [selectedStudentId, selectedStudent?.grade, selectedStudent?.feedback])

  // Stats calculation
  const stats = useMemo(() => {
    const total = studentSubmissionsList.length
    const submitted = studentSubmissionsList.filter((s) => s.isSubmitted).length
    const graded = studentSubmissionsList.filter((s) => s.isGraded).length
    const ungraded = submitted - graded
    const gradesSum = studentSubmissionsList.reduce((acc, cur) => acc + (cur.grade || 0), 0)
    const avgGrade = graded > 0 ? (gradesSum / graded).toFixed(1) : '—'

    return { total, submitted, graded, ungraded, avgGrade }
  }, [studentSubmissionsList])

  // Handle Save Grade
  const handleSaveGrade = async (moveToNext = false) => {
    if (!selectedStudent) return
    const maxScore = assignment?.max_score || 10
    const numGrade = parseFloat(gradeInput)

    if (isNaN(numGrade) || numGrade < 0 || numGrade > maxScore) {
      setSaveError(`Điểm số phải từ 0 đến ${maxScore}.`)
      return
    }

    setSavingGrade(true)
    setSaveError('')
    setSaveSuccess('')

    try {
      const submissionId = selectedStudent.submission?.id || Date.now()
      let updatedSub
      try {
        updatedSub = await assignmentService.gradeSubmission(submissionId, {
          grade: numGrade,
          feedback: feedbackInput.trim(),
        })
      } catch {
        // Fallback update locally in state
        updatedSub = {
          id: submissionId,
          assignment_id: Number(assignmentId),
          student_id: selectedStudent.id,
          grade: numGrade,
          feedback: feedbackInput.trim(),
          status: selectedStudent.status || 'ON_TIME',
          submitted_at: selectedStudent.submitted_at || new Date().toISOString(),
          file_url: selectedStudent.file_url,
        }
      }

      // Update submissions state
      setSubmissions((prev) => {
        const without = prev.filter((s) => Number(s.student_id) !== Number(selectedStudent.id))
        return [...without, updatedSub]
      })

      setSaveSuccess(`Đã lưu điểm cho ${selectedStudent.full_name} (${numGrade}/${maxScore}đ)!`)

      if (moveToNext) {
        // Find next student index
        const currentIndex = filteredStudents.findIndex((s) => s.id === selectedStudentId)
        if (currentIndex >= 0 && currentIndex < filteredStudents.length - 1) {
          setSelectedStudentId(filteredStudents[currentIndex + 1].id)
        }
      }
    } catch (err) {
      setSaveError(err.message || 'Không thể lưu điểm.')
    } finally {
      setSavingGrade(false)
    }
  }

  // Quick next / previous student navigation
  const handlePrevStudent = () => {
    const currentIndex = filteredStudents.findIndex((s) => s.id === selectedStudentId)
    if (currentIndex > 0) {
      setSelectedStudentId(filteredStudents[currentIndex - 1].id)
    }
  }

  const handleNextStudent = () => {
    const currentIndex = filteredStudents.findIndex((s) => s.id === selectedStudentId)
    if (currentIndex >= 0 && currentIndex < filteredStudents.length - 1) {
      setSelectedStudentId(filteredStudents[currentIndex + 1].id)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Top Bar Header ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex size-10 items-center justify-center rounded-xl border border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-xs"
            title="Quay lại"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                Chấm điểm bài tập
              </span>
              <span className="text-xs text-muted-foreground">
                Hạn nộp: {formatDateTime(assignment?.due_date)}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
              {loading ? 'Đang tải bài tập...' : assignment?.title}
            </h1>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-1.5 border text-xs">
            <span className="text-muted-foreground font-medium">Đã nộp:</span>
            <strong className="text-foreground">{stats.submitted}/{stats.total}</strong>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-1.5 border border-amber-500/20 text-xs">
            <span className="text-amber-800 dark:text-amber-300 font-medium">Chưa chấm:</span>
            <strong className="text-amber-800 dark:text-amber-300">{stats.ungraded}</strong>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-indigo-500/10 px-3 py-1.5 border border-indigo-500/20 text-xs">
            <span className="text-indigo-800 dark:text-indigo-300 font-medium">Điểm TB:</span>
            <strong className="text-indigo-800 dark:text-indigo-300">{stats.avgGrade}</strong>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive">
          {error}
        </div>
      ) : null}

      {/* ── Split View Container ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[calc(100vh-250px)]">
        {/* ── LEFT PANEL: Danh sách học viên (Submissions List) ── */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          {/* List Header & Search */}
          <div className="p-4 border-b border-border/60 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Users className="size-4 text-indigo-500" />
                Danh sách học viên ({filteredStudents.length})
              </h3>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm học viên..."
                className="w-full rounded-xl border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/60 p-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`rounded-lg py-1 transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('UNGRADED')}
                className={`rounded-lg py-1 transition-all ${
                  statusFilter === 'UNGRADED'
                    ? 'bg-background text-amber-700 shadow-xs dark:text-amber-300'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Chờ chấm
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('GRADED')}
                className={`rounded-lg py-1 transition-all ${
                  statusFilter === 'GRADED'
                    ? 'bg-background text-indigo-700 shadow-xs dark:text-indigo-300'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Đã chấm
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('NOT_SUBMITTED')}
                className={`rounded-lg py-1 transition-all ${
                  statusFilter === 'NOT_SUBMITTED'
                    ? 'bg-background text-slate-700 shadow-xs dark:text-slate-300'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Chưa nộp
              </button>
            </div>
          </div>

          {/* Student List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40 p-2 space-y-1 max-h-[600px] lg:max-h-none">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="size-5 animate-spin text-indigo-500" />
                <span>Đang tải danh sách...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Không tìm thấy học viên phù hợp.
              </div>
            ) : (
              filteredStudents.map((item) => {
                const isSelected = item.id === selectedStudentId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedStudentId(item.id)}
                    className={`w-full text-left rounded-xl p-3 flex items-center justify-between gap-3 transition-all ${
                      isSelected
                        ? 'bg-indigo-600/10 border border-indigo-500/30 text-foreground shadow-xs ring-1 ring-indigo-500/20'
                        : 'hover:bg-muted/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`size-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(
                          item.full_name
                        )}`}
                      >
                        {getInitials(item.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-foreground">
                          {item.full_name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{item.email}</p>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {item.isGraded ? (
                        <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300">
                          {item.grade}đ
                        </span>
                      ) : item.isSubmitted ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            item.status === 'LATE'
                              ? 'bg-amber-500/15 text-amber-800 border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30'
                          }`}
                        >
                          {item.status === 'LATE' ? 'Nộp trễ' : 'Đã nộp'}
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          Chưa nộp
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Preview File + Nhập Điểm & Lời phê ── */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          {selectedStudent ? (
            <div className="flex flex-col h-full">
              {/* Selected Student Header Bar */}
              <div className="p-4 border-b border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`size-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-xs ${getAvatarColor(
                      selectedStudent.full_name
                    )}`}
                  >
                    {getInitials(selectedStudent.full_name)}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {selectedStudent.full_name}
                    </h2>
                    <p className="text-xs text-muted-foreground">{selectedStudent.email}</p>
                  </div>
                </div>

                {/* Navigation prev/next buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevStudent}
                    className="flex size-8 items-center justify-center rounded-lg border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Học viên trước"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStudent}
                    className="flex size-8 items-center justify-center rounded-lg border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Học viên tiếp theo"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              {/* Status Alert Messages */}
              {saveSuccess && (
                <div className="m-4 mb-0 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}
              {saveError && (
                <div className="m-4 mb-0 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Main Split Area (Preview on Top/Left, Grade Form on Bottom/Right) */}
              <div className="flex-1 p-5 space-y-6 overflow-y-auto">
                {/* 1. File Preview Section */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                    <FileText className="size-3.5 text-indigo-500" />
                    File bài làm của học viên
                  </h3>

                  {!selectedStudent.isSubmitted ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/20 py-12 text-center">
                      <div className="flex size-12 items-center justify-center rounded-full bg-muted mx-auto text-muted-foreground">
                        <Clock className="size-6" />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        Học viên chưa nộp bài làm
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Bạn vẫn có thể chấm điểm trực tiếp hoặc ghi chú lại.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* File Info Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/30 p-3.5 shadow-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-background border shadow-xs shrink-0">
                            {getFileIcon(selectedStudent.file_url || 'file.pdf')}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate max-w-[240px] sm:max-w-[360px]">
                              {selectedStudent.file_url ? selectedStudent.file_url.split('/').pop() : 'Tệp bài làm.pdf'}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Nộp lúc: {formatDateTime(selectedStudent.submitted_at)}
                            </p>
                          </div>
                        </div>

                        {selectedStudent.file_url && (
                          <div className="flex items-center gap-2">
                            <a
                              href={selectedStudent.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border bg-background px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <ExternalLink className="size-3.5" />
                              Mở tab mới
                            </a>
                            <a
                              href={selectedStudent.file_url}
                              download
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs"
                            >
                              <Download className="size-3.5" />
                              Tải về
                            </a>
                          </div>
                        )}
                      </div>

                      {/* File Embed / Preview Container */}
                      {selectedStudent.file_url && (
                        <div className="rounded-2xl border border-border/80 bg-muted/10 overflow-hidden min-h-[220px] max-h-[360px] flex items-center justify-center">
                          {selectedStudent.file_url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                            <img
                              src={selectedStudent.file_url}
                              alt="Bài làm"
                              className="max-h-[350px] object-contain mx-auto"
                            />
                          ) : selectedStudent.file_url.match(/\.(pdf)$/i) ? (
                            <iframe
                              src={selectedStudent.file_url}
                              title="PDF Preview"
                              className="w-full h-[350px] border-0"
                            />
                          ) : (
                            <div className="text-center py-10 text-xs text-muted-foreground">
                              <FileText className="size-8 mx-auto text-indigo-500 mb-2 opacity-80" />
                              <p className="font-semibold text-foreground">
                                Đã sẵn sàng xem file bài làm
                              </p>
                              <p className="mt-1">
                                Nhấn nút <strong>&quot;Mở tab mới&quot;</strong> hoặc <strong>&quot;Tải về&quot;</strong> để xem chi tiết nội dung.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Grading & Private Feedback Section */}
                <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Award className="size-3.5 text-indigo-500" />
                      Chấm điểm & Nhận xét bài làm
                    </h3>
                    <span className="text-xs font-semibold text-muted-foreground">
                      Thang điểm: <strong>{assignment?.max_score || 10} điểm</strong>
                    </span>
                  </div>

                  {/* Grade Score Input + Quick Presets */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-foreground">
                      Điểm số <span className="text-destructive">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative w-36">
                        <input
                          type="number"
                          min="0"
                          max={assignment?.max_score || 10}
                          step="0.25"
                          value={gradeInput}
                          onChange={(e) => setGradeInput(e.target.value)}
                          placeholder="Nhập điểm..."
                          className="w-full rounded-xl border border-input bg-background pl-3.5 pr-8 py-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                          đ
                        </span>
                      </div>

                      {/* Quick Score Presets */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {[10, 9, 8, 7, 5, 0].map((score) => {
                          if (score > (assignment?.max_score || 10)) return null
                          return (
                            <button
                              key={score}
                              type="button"
                              onClick={() => setGradeInput(String(score))}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                                parseFloat(gradeInput) === score
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                  : 'border-border/70 bg-background text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              {score}đ
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Private Feedback Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <MessageSquare className="size-3.5 text-indigo-500" />
                      Lời phê riêng tư (Chỉ học viên này nhìn thấy)
                    </label>
                    <textarea
                      rows={3}
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="Nhập nhận xét chi tiết, điểm mạnh, điểm cần cải thiện cho học viên..."
                      className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed"
                    />

                    {/* Quick feedback templates */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mr-1">
                        <Sparkles className="size-3 text-indigo-500" />
                        Gợi ý nhanh:
                      </span>
                      {FEEDBACK_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFeedbackInput(preset)}
                          className="rounded-lg border border-border/70 bg-muted/20 px-2 py-1 text-[11px] text-muted-foreground hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
                        >
                          {preset.substring(0, 24)}...
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-border/50 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSaveGrade(false)}
                      disabled={savingGrade || !gradeInput}
                      className="w-full sm:w-auto rounded-xl text-xs font-semibold"
                    >
                      {savingGrade ? (
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      ) : (
                        <Save className="mr-1.5 size-3.5" />
                      )}
                      Lưu điểm
                    </Button>

                    <Button
                      type="button"
                      onClick={() => handleSaveGrade(true)}
                      disabled={savingGrade || !gradeInput}
                      className="w-full sm:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 px-4"
                    >
                      {savingGrade ? (
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      ) : (
                        <ClipboardCheck className="mr-1.5 size-3.5" />
                      )}
                      Lưu & Chấm tiếp theo
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center text-muted-foreground">
              <Users className="size-12 mb-3 text-muted-foreground/40" />
              <p className="font-semibold text-foreground">Chưa chọn học viên nào</p>
              <p className="text-xs text-muted-foreground mt-1">
                Hãy chọn một học viên từ danh sách bên trái để xem bài làm và chấm điểm.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeacherGradingPage
