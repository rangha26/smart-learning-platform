import apiClient from './axios'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from './tokenKeys'

export const authService = {
  /**
   * Register a new user
   * @param {Object} data - { email, password, fullName, role }
   */
  async register({ email, password, fullName, role = 'student' }) {
    const normalizedRole = (role || '').toUpperCase()
    const backendRole = normalizedRole === 'TEACHER' || normalizedRole === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT'

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
   * Exchange the stored refresh token for a new access token.
   * Persists the new access token and (if returned) a rotated refresh token.
   * @returns {Promise<string>} Resolves with the new access token string.
   * @throws Will throw (and clear the session) if the refresh token is missing or rejected by the server.
   */
  async refreshToken() {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!storedRefreshToken) {
      this.logout()
      throw new Error('Không có refresh token. Vui lòng đăng nhập lại.')
    }

    const response = await apiClient.post('/auth/refresh', {
      refresh_token: storedRefreshToken,
    })

    const { access_token, refresh_token } = response.data

    // Lưu access token mới
    localStorage.setItem(ACCESS_TOKEN_KEY, access_token)

    // Nếu server trả về refresh token mới (rotation), cập nhật luôn
    if (refresh_token && refresh_token !== storedRefreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
    }

    return access_token
  },

  /**
   * Bước 1: Yêu cầu mã OTP quên mật khẩu, gửi qua email.
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
          message: `Nếu địa chỉ email '${email}' tồn tại trong hệ thống, mã OTP đã được gửi tới hòm thư của bạn.`,
        }
      }
      throw error
    }
  },

  /**
   * Bước 2: Xác thực mã OTP 6 số. Trả về reset_session_token dùng cho bước 3.
   * @param {Object} data - { email, otpCode }
   */
  async verifyOtp({ email, otpCode }) {
    try {
      const response = await apiClient.post('/auth/verify-otp', {
        email,
        otp_code: otpCode,
      })
      return response.data
    } catch (error) {
      if (!error.response && import.meta.env.DEV) {
        return {
          success: true,
          reset_session_token: 'dev-mock-reset-session-token',
          message: 'Mã OTP hợp lệ. Vui lòng nhập mật khẩu mới.',
        }
      }
      throw error
    }
  },

  /**
   * Bước 3: Đặt lại mật khẩu bằng reset_session_token nhận từ bước verify-otp.
   * @param {Object} data - { resetSessionToken, newPassword }
   */
  async resetPassword({ resetSessionToken, newPassword }) {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        reset_session_token: resetSessionToken,
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
   * Save access token, refresh token, and user data to localStorage.
   * @param {Object} authData - { user, tokens: { access_token, refresh_token } }
   */
  saveSession(authData) {
    if (authData.tokens?.access_token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, authData.tokens.access_token)
    }
    if (authData.tokens?.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, authData.tokens.refresh_token)
    }
    if (authData.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(authData.user))
    }
  },

  /**
   * Clear session data from localStorage.
   */
  logout() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  /**
   * Get current stored user object.
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(USER_KEY)
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  },

  /**
   * Get current stored access token.
   */
  getToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },
}

export default authService
