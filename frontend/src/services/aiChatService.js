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

export const aiChatService = {
  /**
   * Gửi câu hỏi tới trợ lý AI của một lớp học cụ thể (RAG dựa trên tài liệu lớp học đó)
   */
  async sendMessage(classId, message) {
    try {
      const response = await apiClient.post(
        `/classes/${classId}/ai-chat/message`,
        { message },
        { timeout: 30000 }
      )
      return response.data?.answer ?? ''
    } catch (error) {
      throwServiceError(error, 'Không thể trả lời lúc này. Vui lòng thử lại.')
    }
  },
}

export default aiChatService