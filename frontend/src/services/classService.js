import apiClient from './axios'

function getErrorMessage(error, fallback) {
  const data = error.response?.data
  return (
    data?.error?.message ||
    data?.detail ||
    data?.message ||
    error.message ||
    fallback
  )
}

function throwServiceError(error, fallback) {
  throw new Error(getErrorMessage(error, fallback))
}

export const classService = {
  /**
   * Tạo lớp học mới (Dành cho Giáo viên)
   * @param {Object} payload { title, subject, description, join_code }
   */
  async createClass(payload) {
    try {
      const response = await apiClient.post('/classes', payload)
      return response.data
    } catch (error) {
      // Cho phép fallback mock local khi chạy client-only dev
      if (!error.response && import.meta.env.DEV) {
        console.warn('Backend unavailable, using mock class creation fallback.')
        return {
          id: Date.now(),
          title: payload.title,
          subject: payload.subject || 'Công nghệ thông tin',
          description: payload.description || '',
          join_code: payload.join_code || 'CLASS' + Math.floor(1000 + Math.random() * 9000),
          instructor_id: 1,
          instructor: { id: 1, full_name: 'Giảng viên', email: 'teacher@example.com' },
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
          student_count: 0,
        }
      }
      throwServiceError(error, 'Khong the tao lop hoc. Vui long thu lai.')
    }
  },

  /**
   * Tham gia lớp học bằng Mã (Dành cho Học viên)
   * @param {string} joinCode
   */
  async joinClass(joinCode) {
    try {
      const response = await apiClient.post('/classes/join', { join_code: joinCode })
      return response.data
    } catch (error) {
      if (!error.response && import.meta.env.DEV) {
        console.warn('Backend unavailable, using mock class join fallback.')
        const cleaned = joinCode.trim().toUpperCase()
        return {
          id: Date.now(),
          title: `Lớp học (${cleaned})`,
          subject: 'Chuyên đề học tập',
          description: 'Lớp học nhóm vừa tham gia thành công.',
          join_code: cleaned,
          instructor_id: 2,
          instructor: { id: 2, full_name: 'ThS. Nguyễn Văn A', email: 'instructor@example.com' },
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
          student_count: 15,
        }
      }
      throwServiceError(error, 'Ma tham gia khong chinh xac hoac lop khong ton tai.')
    }
  },

  /**
   * Lấy danh sách lớp học của tôi
   */
  async getMyClasses() {
    try {
      const response = await apiClient.get('/classes/my-classes')
      return response.data
    } catch (error) {
      if (!error.response && import.meta.env.DEV) {
        return []
      }
      throwServiceError(error, 'Khong the tai danh sach lop hoc.')
    }
  },

  async getClassById(classId) {
    try {
      const response = await apiClient.get(`/classes/${classId}`)
      return response.data
    } catch (error) {
      if (!error.response && import.meta.env.DEV) {
        return null
      }
      throwServiceError(error, 'Khong the tai thong tin lop hoc.')
    }
  },
}
