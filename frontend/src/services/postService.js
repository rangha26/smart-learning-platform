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

export const postService = {
  /**
   * Lấy danh sách bài đăng (kèm bình luận lồng nhau) của một lớp học
   */
  async getClassPosts(classId) {
    try {
      const response = await apiClient.get(`/classes/${classId}/posts`)
      return response.data
    } catch (error) {
      if (!error.response && import.meta.env.DEV) {
        return []
      }
      throwServiceError(error, 'Không thể tải bảng tin lớp học.')
    }
  },

  /**
   * Đăng thông báo mới (chỉ giảng viên của lớp)
   */
  async createPost(classId, content, files = []) {
    try {
      const formData = new FormData()
      formData.append('content', content)
      
      // Append each file with the key 'files' (matching the backend list[UploadFile] name)
      files.forEach(file => {
        formData.append('files', file)
      })

      const response = await apiClient.post(`/classes/${classId}/posts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      throwServiceError(error, 'Không thể đăng thông báo. Vui lòng thử lại.')
    }
  },

  /**
   * Bình luận vào một bài đăng, hoặc trả lời một bình luận khác (truyền parentId)
   */
  async createComment(postId, content, parentId = null) {
    try {
      const response = await apiClient.post(`/posts/${postId}/comments`, {
        content,
        parent_id: parentId,
      })
      return response.data
    } catch (error) {
      throwServiceError(error, 'Không thể gửi bình luận. Vui lòng thử lại.')
    }
  },
}

export default postService
