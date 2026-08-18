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

export const adminService = {
  /**
   * Lấy danh sách người dùng với tìm kiếm và lọc vai trò
   * @param {Object} params { search, role }
   */
  async getUsers({ search = '', role = '' } = {}) {
    try {
      const params = {}
      if (search) params.search = search
      if (role && role !== 'ALL') params.role = role

      const response = await apiClient.get('/admin/users', { params })
      return response.data
    } catch (error) {
      if (!error.response && import.meta.env.DEV) {
        console.warn('Backend unavailable, using mock admin users fallback.')
        const mockUsers = [
          {
            id: 1,
            email: 'admin@example.com',
            full_name: 'Quản Trị Viên Hệ Thống',
            role: 'ADMIN',
            status: 'ACTIVE',
            created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          },
          {
            id: 2,
            email: 'gv.nguyenvana@example.com',
            full_name: 'ThS. Nguyễn Văn A',
            role: 'INSTRUCTOR',
            status: 'ACTIVE',
            created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
          },
          {
            id: 3,
            email: 'gv.tranthib@example.com',
            full_name: 'TS. Trần Thị B',
            role: 'INSTRUCTOR',
            status: 'ACTIVE',
            created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
          },
          {
            id: 4,
            email: 'sv.lehoangc@example.com',
            full_name: 'Lê Hoàng Cường',
            role: 'STUDENT',
            status: 'ACTIVE',
            created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
          },
          {
            id: 5,
            email: 'sv.phamminhd@example.com',
            full_name: 'Phạm Minh Dũng',
            role: 'STUDENT',
            status: 'INACTIVE',
            created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
          },
          {
            id: 6,
            email: 'sv.hoangmaip@example.com',
            full_name: 'Hoàng Mai Phương',
            role: 'STUDENT',
            status: 'ACTIVE',
            created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
          },
        ]
        return mockUsers.filter((u) => {
          const matchSearch =
            !search ||
            u.full_name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
          const matchRole = !role || role === 'ALL' || u.role === role
          return matchSearch && matchRole
        })
      }
      throwServiceError(error, 'Không thể tải danh sách người dùng.')
    }
  },

  /**
   * Cập nhật trạng thái người dùng (Khóa / Mở khóa)
   * @param {number|string} userId
   * @param {'ACTIVE'|'INACTIVE'} status
   */
  async updateUserStatus(userId, status) {
    try {
      const response = await apiClient.patch(`/admin/users/${userId}/status`, { status })
      return response.data
    } catch (error) {
      if (!error.response && import.meta.env.DEV) {
        console.warn('Backend unavailable, using mock status update fallback.')
        return { id: Number(userId), status }
      }
      throwServiceError(error, 'Không thể cập nhật trạng thái người dùng.')
    }
  },
}

export default adminService
