import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { getRoleHomePath } from '@/components/auth/rolePaths'
import { AuthProvider } from '@/context/AuthContext'
import { useAuth } from '@/context/useAuth'

// Chỉ tải widget khi thực sự cần (sau khi đăng nhập) - tránh nằm trong bundle chính
const AIChatbotWidget = lazy(() => import('@/components/ui/AIChatbotWidget'))

// Layouts
import { AdminLayout } from '@/layouts/AdminLayout'
import { StudentLayout } from '@/layouts/StudentLayout'
import { TeacherLayout } from '@/layouts/TeacherLayout'

// Admin Pages
import { AdminCourseManagementPage } from '@/pages/admin/CourseManagement'
import { AdminDashboardPage } from '@/pages/admin/Dashboard'
import { AdminReportsPage } from '@/pages/admin/Reports'
import { AdminUserManagementPage } from '@/pages/admin/UserManagement'

// Teacher Pages
import { TeacherAssignmentsPage } from '@/pages/teacher/Assignments'
import { TeacherDashboardPage } from '@/pages/teacher/Dashboard'
import { TeacherGradingPage } from '@/pages/teacher/Grading'
import { TeacherMyCoursesPage } from '@/pages/teacher/MyCourses'
import { TeacherStudentsPage } from '@/pages/teacher/Students'

// Student Pages
import { StudentHomePage } from '@/pages/student/Home'
import { StudentLearningPage } from '@/pages/student/Learning'
import { StudentProfilePage } from '@/pages/student/Profile'

// Shared Pages
import { ClassDetailPage } from '@/pages/ClassDetail'

// Auth Pages
import { ForgotPasswordPage } from '@/pages/auth/ForgotPassword'
import { LoginPage } from '@/pages/auth/Login'
import { RegisterPage } from '@/pages/auth/Register'

function RootRedirect() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated || !user) {
    return <Navigate replace to="/login" />
  }
  return <Navigate replace to={getRoleHomePath(user.role)} />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect based on auth & role */}
      <Route element={<RootRedirect />} path="/" />

      {/* Auth Public Routes */}
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RegisterPage />} path="/register" />
      <Route element={<ForgotPasswordPage />} path="/forgot-password" />

      {/* Admin Role Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route element={<AdminDashboardPage />} path="/admin" />
          <Route element={<AdminUserManagementPage />} path="/admin/users" />
          <Route element={<AdminCourseManagementPage />} path="/admin/courses" />
          <Route element={<AdminReportsPage />} path="/admin/reports" />
        </Route>
      </Route>

      {/* Teacher / Instructor Role Routes */}
      <Route element={<ProtectedRoute allowedRoles={['INSTRUCTOR', 'TEACHER']} />}>
        <Route element={<TeacherLayout />}>
          <Route element={<TeacherDashboardPage />} path="/teacher" />
          <Route element={<TeacherMyCoursesPage />} path="/teacher/courses" />
          <Route element={<TeacherAssignmentsPage />} path="/teacher/assignments" />
          <Route element={<TeacherStudentsPage />} path="/teacher/students" />
          <Route element={<ClassDetailPage />} path="/teacher/class/:id" />
          <Route element={<TeacherGradingPage />} path="/teacher/assignments/:assignmentId/grading" />
          <Route element={<TeacherGradingPage />} path="/teacher/class/:classId/assignments/:assignmentId/grading" />
        </Route>
      </Route>

      {/* Student Role Routes */}
      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route element={<StudentLayout />}>
          <Route element={<StudentHomePage />} path="/student" />
          <Route element={<StudentLearningPage />} path="/student/learning" />
          <Route element={<StudentProfilePage />} path="/student/profile" />
          <Route element={<ClassDetailPage />} path="/student/class/:id" />
        </Route>
      </Route>

      {/* Fallback Catch-all Route */}
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  )
}

function AuthenticatedChatbot() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return null
  return (
    <Suspense fallback={null}>
      <AIChatbotWidget />
    </Suspense>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <AuthenticatedChatbot />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
