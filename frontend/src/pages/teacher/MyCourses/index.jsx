import { useState } from 'react'
import { Copy, Check, FolderPlus, Key, Users, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateClassModal } from '@/components/classes'
import { useNavigate } from 'react-router-dom'

const defaultCourses = [
  { title: 'Frontend Foundations', subject: 'Lập trình Web', status: 'Live', learners: 28, join_code: 'FRONT88' },
  { title: 'Design Systems', subject: 'Thiết kế UI/UX', status: 'Active', learners: 19, join_code: 'DS2024X' },
]

export function TeacherMyCoursesPage() {
  const [courses, setCourses] = useState(defaultCourses)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)
  const navigate = useNavigate()

  const handleClassCreated = (newClass) => {
    setCourses((prev) => [
      {
        title: newClass.title,
        subject: newClass.subject || 'Công nghệ thông tin',
        status: 'Active',
        learners: newClass.student_count || 0,
        join_code: newClass.join_code,
      },
      ...prev,
    ])
  }

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Teacher workspace</p>
          <h2 className="text-2xl font-bold tracking-tight">Quản lý Lớp học của tôi</h2>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/20"
        >
          <FolderPlus className="mr-2 size-4" />
          Tạo lớp học mới
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((course) => (
          <article
            className="rounded-2xl border bg-card p-5 text-card-foreground shadow-xs transition-all hover:border-indigo-200 hover:shadow-md flex flex-col justify-between gap-4"
            key={course.title}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{course.title}</h3>
                  {course.subject && (
                    <span className="inline-block mt-1 text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {course.subject}
                    </span>
                  )}
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  {course.status}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-4 text-indigo-600" />
                <span className="font-medium">{course.learners} học viên</span>
              </div>

              {course.join_code && (
                <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-xl border border-border/60">
                  <Key className="size-3.5 text-indigo-600" />
                  <span className="font-mono font-bold tracking-wider text-foreground">
                    {course.join_code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(course.join_code)}
                    title="Sao chép mã tham gia"
                    className="ml-1 text-muted-foreground hover:text-indigo-600 transition-colors"
                  >
                    {copiedCode === course.join_code ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/teacher/class/${course.join_code || 1}`)}
                className="ml-auto text-indigo-700 border-indigo-200 hover:bg-indigo-50 gap-1.5"
              >
                Xem lớp
                <ExternalLink className="size-3.5" />
              </Button>
            </div>
          </article>
        ))}
      </div>

      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleClassCreated}
      />
    </section>
  )
}
