import apiClient from './axios'

export const authService = {
  /**
   * Register a new user
   * @param {Object} data - { email, password, fullName, role }
   */
  async register({ email, password, fullName, role = 'student' }) {
    let backendRole = 'STUDENT'
    const normalizedRole = (role || '').toUpperCase()
    if (normalizedRole === 'TEACHER' || normalizedRole === 'INSTRUCTOR') {
      backendRole = 'INSTRUCTOR'
    } else {
      backendRole = 'STUDENT'
    }

    const payload = {
      email,
      password,
      full_name: fullName,
      role: backendRole,
    }

    const response = await apiClient.post('/auth/register', payload)
    if (response.data?.tokens) {
      this.saveSession(response.data)
    }
    return response.data
  },

  /**
   * Login with email and password
   * @param {Object} credentials - { email, password }
   */
  async login({ email, password }) {
    const response = await apiClient.post('/auth/login', { email, password })
    if (response.data?.tokens) {
      this.saveSession(response.data)
    }
    return response.data
  },

  /**
   * Request password reset link
   * @param {string} email
   */
  async forgotPassword(email) {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email })
      return response.data
    } catch (error) {
      if (!error.response && import.meta.env.DEV) {
        return {
          success: true,
          message: `Nếu địa chỉ email '${email}' tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi tới hòm thư của bạn.`,
        }
      }
      throw error
    }
  },

  /**
   * Reset password with token/code
   * @param {Object} data - { token, newPassword }
   */
  async resetPassword({ token, newPassword }) {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        new_password: newPassword,
      })
      return response.data
    } catch (error) {
      if (!error.response && import.meta.env.DEV) {
        return {
          success: true,
          message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.',
        }
      }
      throw error
    }
  },

  /**
   * Save access token, refresh token, and user data to localStorage
   * @param {Object} authData - { user, tokens: { access_token, refresh_token } }
   */
  saveSession(authData) {
    if (authData.tokens?.access_token) {
      localStorage.setItem('access_token', authData.tokens.access_token)
    }
    if (authData.tokens?.refresh_token) {
      localStorage.setItem('refresh_token', authData.tokens.refresh_token)
    }
    if (authData.user) {
      localStorage.setItem('user', JSON.stringify(authData.user))
    }
  },

  /**
   * Clear session data from localStorage
   */
  logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  },

  /**
   * Get current stored user object
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  },

  /**
   * Get current stored access token
   */
  getToken() {
    return localStorage.getItem('access_token')
  },
}

export default authService
