/**
 * Hằng số các key lưu trữ token/session trong localStorage.
 * Tập trung tại đây để authService và axios interceptor
 * không bao giờ bị lệch tên key.
 */
export const ACCESS_TOKEN_KEY = 'access_token'
export const REFRESH_TOKEN_KEY = 'refresh_token'
export const USER_KEY = 'user'
