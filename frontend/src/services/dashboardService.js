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

export const dashboardService = {
  async getAdminDashboard() {
    try {
      const response = await apiClient.get('/dashboard/admin')
      return response.data
    } catch (error) {
      throwServiceError(error, 'Không thể tải dữ liệu thống kê hệ thống.')
    }
  },

  async getTeacherDashboard() {
    try {
      const response = await apiClient.get('/dashboard/teacher')
      return response.data
    } catch (error) {
      throwServiceError(error, 'Không thể tải dữ liệu tổng quan giảng dạy.')
    }
  },

  async getStudentDashboard() {
    try {
      const response = await apiClient.get('/dashboard/student')
      return response.data
    } catch (error) {
      throwServiceError(error, 'Không thể tải dữ liệu học tập.')
    }
  },
}

export default dashboardService
