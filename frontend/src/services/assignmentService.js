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

export const assignmentService = {
  /**
   * Tạo bài tập mới cho lớp học (Giảng viên)
   * @param {number|string} classId
   * @param {Object} payload { title, description, due_date, max_score, file }
   */
  async createAssignment(classId, { title, description, due_date, max_score = 10, file = null }) {
    try {
      const formData = new FormData()
      formData.append('title', title)
      if (description) {
        formData.append('description', description)
      }
      
      // Chuyển due_date sang ISO string
      const isoDueDate = typeof due_date === 'string' 
        ? (due_date.includes('T') ? new Date(due_date).toISOString() : due_date)
        : due_date.toISOString()
      formData.append('due_date', isoDueDate)
      formData.append('max_score', String(max_score))

      if (file) {
        formData.append('file', file)
      }

      const response = await apiClient.post(`/assignments/classes/${classId}/`, formData, {
        headers: { 'Content-Type': undefined },
      })
      return response.data
    } catch (error) {
      if (!error.response && import.meta.env.DEV) {
        console.warn('Backend unavailable, using mock assignment creation fallback.')
        return {
          id: Date.now(),
          class_id: Number(classId),
          title,
          description: description || '',
          due_date: typeof due_date === 'string' ? due_date : due_date.toISOString(),
          max_score: Number(max_score),
          file_url: file ? URL.createObjectURL(file) : null,
          created_at: new Date().toISOString(),
        }
      }
      throwServiceError(error, 'Không thể tạo bài tập. Vui lòng thử lại.')
    }
  },

  /**
   * Lấy danh sách bài tập của lớp học
   * @param {number|string} classId
   */
  async getClassAssignments(classId) {
    try {
      const response = await apiClient.get('/assignments', {
        params: { class_id: classId, page_size: 100 },
      })
      return response.data?.assignments || []
    } catch (error) {
      if (!error.response && import.meta.env.DEV) {
        return []
      }
      throwServiceError(error, 'Không thể tải danh sách bài tập của lớp.')
    }
  },

  /**
   * Lấy danh sách bài tập của người dùng hiện tại
   */
  async getMyAssignments(page = 1, pageSize = 20) {
    try {
      const response = await apiClient.get('/assignments', {
        params: { page, page_size: pageSize },
      })
      return response.data
    } catch (error) {
      if (!error.response && import.meta.env.DEV) {
        return { total_count: 0, page: 1, page_size: pageSize, assignments: [] }
      }
      throwServiceError(error, 'Không thể tải danh sách bài tập.')
    }
  },

  /**
   * Lấy bài nộp của học viên cho một bài tập cụ thể
   * @param {number|string} assignmentId
   */
  async getMySubmission(assignmentId) {
    try {
      const response = await apiClient.get(`/assignments/${assignmentId}/my-submission`)
      return response.data
    } catch (error) {
      // 404 nghĩa là sinh viên chưa nộp bài
      if (error.response?.status === 404) {
        return null
      }
      if (!error.response && import.meta.env.DEV) {
        return null
      }
      throwServiceError(error, 'Không thể tải thông tin bài nộp.')
    }
  },

  /**
   * Nộp bài tập (Sinh viên)
   * @param {number|string} assignmentId
   * @param {File} file
   */
  async submitAssignment(assignmentId, file) {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiClient.post(`/assignments/${assignmentId}/submit`, formData, {
        headers: { 'Content-Type': undefined },
      })
      return response.data
    } catch (error) {
      if (!error.response && import.meta.env.DEV) {
        console.warn('Backend unavailable, using mock submission fallback.')
        return {
          id: Date.now(),
          assignment_id: Number(assignmentId),
          student_id: 999,
          file_url: URL.createObjectURL(file),
          file_name: file.name,
          submitted_at: new Date().toISOString(),
          status: 'ON_TIME',
          grade: null,
          feedback: null,
        }
      }
      throwServiceError(error, 'Không thể nộp bài tập. Vui lòng thử lại.')
    }
  },

  /**
   * Hủy nộp bài tập (Sinh viên)
   * @param {number|string} assignmentId
   */
  async unsubmitAssignment(assignmentId) {
    try {
      const response = await apiClient.delete(`/assignments/${assignmentId}/unsubmit`)
      return response.data
    } catch (error) {
      if (!error.response && import.meta.env.DEV) {
        console.warn('Backend unavailable, using mock unsubmit fallback.')
        return { message: 'Hủy nộp bài tập thành công.' }
      }
      throwServiceError(error, 'Không thể hủy nộp bài. Vui lòng thử lại.')
    }
  },

  /**
   * Lấy thống kê nộp bài (Giảng viên)
   */
  async getAssignmentStats(assignmentId) {
    try {
      const response = await apiClient.get(`/assignments/${assignmentId}/stats`)
      return response.data
    } catch (error) {
      throwServiceError(error, 'Không thể tải thống kê bài tập.')
    }
  },

  /**
   * Lấy danh sách bài nộp của bài tập (Giảng viên)
   */
  async getSubmissions(assignmentId) {
    try {
      const response = await apiClient.get(`/assignments/${assignmentId}/submissions`)
      return response.data
    } catch (error) {
      throwServiceError(error, 'Không thể tải danh sách nộp bài.')
    }
  },

  /**
   * Chấm điểm bài nộp (Giảng viên)
   */
  async gradeSubmission(submissionId, { grade, feedback = '' }) {
    try {
      const response = await apiClient.patch(`/assignments/submissions/${submissionId}/grade`, {
        grade,
        feedback,
      })
      return response.data
    } catch (error) {
      throwServiceError(error, 'Không thể lưu điểm bài nộp.')
    }
  },
}

export default assignmentService
