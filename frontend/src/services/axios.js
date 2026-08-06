import axios from 'axios'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from './tokenKeys'

const rawApiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const baseURL = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api/v1`

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Refresh-token state ──────────────────────────────────────────────────────
/** true khi đang có 1 request refresh đang bay, tránh gọi refresh song song */
let isRefreshing = false

/**
 * Hàng đợi các request bị 401 trong lúc chờ refresh hoàn tất.
 * Mỗi phần tử là { resolve, reject } của Promise bao ngoài request gốc.
 */
let failedQueue = []

/**
 * Giải phóng hàng đợi sau khi refresh xong.
 * @param {Error|null} error  - null nếu refresh thành công, Error nếu thất bại
 * @param {string|null} token - access token mới (chỉ có khi thành công)
 */
function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  failedQueue = []
}

/** Xóa toàn bộ thông tin phiên và chuyển về trang đăng nhập */
function logout() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  // Dùng replace để không để lại history entry
  window.location.replace('/login')
}
// ─────────────────────────────────────────────────────────────────────────────

// Request interceptor – đính kèm access token vào mọi request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor – xử lý 401 với refresh-token flow
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Chỉ xử lý lỗi 401 và bỏ qua request refresh (tránh vòng lặp vô hạn)
    const is401 = error.response?.status === 401
    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh')
    const isPublicAuthEndpoint = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'].some(
      (path) => originalRequest.url?.includes(path),
    )
    const alreadyRetried = originalRequest._retry

    if (!is401 || isRefreshEndpoint || isPublicAuthEndpoint || alreadyRetried) {
      return Promise.reject(error)
    }

    // Đánh dấu request này đã được retry, tránh retry lần 2
    originalRequest._retry = true

    // Nếu đang có refresh đang chạy → xếp hàng chờ
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return apiClient(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    // Bắt đầu refresh
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) {
      // Không có refresh token → logout ngay
      logout()
      return Promise.reject(error)
    }

    isRefreshing = true

    try {
      const { data } = await axios.post(`${baseURL}/auth/refresh`, {
        refresh_token: refreshToken,
      })

      const newAccessToken = data.access_token
      localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken)

      // Cập nhật header mặc định cho các request tiếp theo
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`

      // Giải phóng hàng đợi với token mới
      processQueue(null, newAccessToken)

      // Retry request gốc
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      // Refresh thất bại → giải phóng hàng đợi với lỗi và logout
      processQueue(refreshError, null)
      logout()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default apiClient
