import { useMemo } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react'

// Helper format date to Vietnamese readable string
function formatVietnameseDate(isoOrDateString) {
  if (!isoOrDateString) return ''
  try {
    const d = new Date(isoOrDateString)
    if (isNaN(d.getTime())) return ''
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
    const dayOfWeek = days[d.getDay()]
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    return `${time} - ${dayOfWeek}, ${date}`
  } catch {
    return isoOrDateString
  }
}

// Calculate human readable diff (e.g. "Còn 3 ngày 4 giờ")
function getTimeDiffDescription(isoOrDateString) {
  if (!isoOrDateString) return null
  try {
    const target = new Date(isoOrDateString)
    if (isNaN(target.getTime())) return null
    const now = new Date()
    const diffMs = target - now
    if (diffMs < 0) {
      return { isPast: true, text: 'Đã quá thời gian hiện tại' }
    }
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays > 0) {
      const remainingHours = diffHours % 24
      return {
        isPast: false,
        text: `Còn ${diffDays} ngày ${remainingHours > 0 ? `${remainingHours} giờ` : ''}`,
      }
    }
    if (diffHours > 0) {
      const remainingMins = diffMins % 60
      return {
        isPast: false,
        text: `Còn ${diffHours} giờ ${remainingMins > 0 ? `${remainingMins} phút` : ''}`,
      }
    }
    return { isPast: false, text: `Còn ${diffMins} phút nữa` }
  } catch {
    return null
  }
}

export function DateTimePicker({ value, onChange, disabled = false, error = '' }) {
  // Parse current value into date part (YYYY-MM-DD) and time part (HH:mm)
  const { datePart, timePart } = useMemo(() => {
    if (!value) {
      return { datePart: '', timePart: '23:59' }
    }
    try {
      const d = new Date(value)
      if (isNaN(d.getTime())) {
        if (typeof value === 'string' && value.includes('T')) {
          const [dStr, tStr] = value.split('T')
          return { datePart: dStr, timePart: tStr.substring(0, 5) }
        }
        return { datePart: '', timePart: '23:59' }
      }
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const hh = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      return {
        datePart: `${yyyy}-${mm}-${dd}`,
        timePart: `${hh}:${min}`,
      }
    } catch {
      return { datePart: '', timePart: '23:59' }
    }
  }, [value])

  const handleDateChange = (newDate) => {
    if (!newDate) {
      onChange('')
      return
    }
    const combined = `${newDate}T${timePart || '23:59'}`
    onChange(combined)
  }

  const handleTimeChange = (newTime) => {
    const curDate = datePart || getTodayString()
    const combined = `${curDate}T${newTime}`
    onChange(combined)
  }

  const setPreset = (daysOffset, customTime = '23:59') => {
    const target = new Date()
    target.setDate(target.getDate() + daysOffset)
    const yyyy = target.getFullYear()
    const mm = String(target.getMonth() + 1).padStart(2, '0')
    const dd = String(target.getDate()).padStart(2, '0')
    const combined = `${yyyy}-${mm}-${dd}T${customTime}`
    onChange(combined)
  }

  function getTodayString() {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const timeDiff = useMemo(() => getTimeDiffDescription(value), [value])

  return (
    <div className="space-y-3">
      {/* Quick selection presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mr-1">
          <Sparkles className="size-3 text-indigo-500" />
          Chọn nhanh:
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setPreset(0, '23:59')}
          className="rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          Tối nay (23:59)
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setPreset(1, '23:59')}
          className="rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          Ngày mai (23:59)
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setPreset(3, '23:59')}
          className="rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          Sau 3 ngày
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setPreset(7, '23:59')}
          className="rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          1 tuần nữa
        </button>
      </div>

      {/* Date & Time Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Date Input */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Ngày hết hạn <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              disabled={disabled}
              value={datePart}
              min={getTodayString()}
              onChange={(e) => handleDateChange(e.target.value)}
              className={`w-full rounded-xl border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                error ? 'border-destructive focus:border-destructive' : 'border-input focus:border-indigo-500'
              }`}
            />
          </div>
        </div>

        {/* Time Input */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Giờ hết hạn <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="time"
              disabled={disabled}
              value={timePart}
              onChange={(e) => handleTimeChange(e.target.value)}
              className={`w-full rounded-xl border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                error ? 'border-destructive focus:border-destructive' : 'border-input focus:border-indigo-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Preview selected date time formatted */}
      {value && (
        <div
          className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs border ${
            timeDiff?.isPast
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300'
          }`}
        >
          <div className="flex items-center gap-1.5 font-medium truncate">
            {timeDiff?.isPast ? (
              <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            )}
            <span className="truncate">Hạn nộp: <strong>{formatVietnameseDate(value)}</strong></span>
          </div>

          {timeDiff && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                timeDiff.isPast
                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                  : 'bg-indigo-500/20 text-indigo-800 dark:text-indigo-200'
              }`}
            >
              {timeDiff.text}
            </span>
          )}
        </div>
      )}

      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}

export default DateTimePicker
