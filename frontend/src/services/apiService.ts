import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api'

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 添加请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 定义消息类型
export interface Message {
  id: number
  text: string
  sender: 'me' | 'other'
  timestamp: Date
  userId: number
  error?: boolean
  errorMessage?: string
}

// 用户相关API
export const userApi = {
  // 获取所有用户
  getAllUsers: () => apiClient.get('/users'),
  
  // 根据ID获取用户
  getUserById: (id: number) => apiClient.get(`/users/${id}`),
  
  // 用户注册
  register: (userData: any) => apiClient.post('/open/register', userData),
  
  // 用户登录
  login: (credentials: any) => apiClient.post('/open/login', credentials),
  
  // 获取在线用户
  getOnlineUsers: () => apiClient.get('/users/online'),
  
  // 获取带未读数量的用户列表
  getWithUnreadCount: () => apiClient.get('/users/with-unread-count'),
  
  // 验证用户邮箱（用于忘记密码）
  verifyUserEmail: (data: any) => apiClient.post('/open/verify-email', data),
  
  // 重置密码
  resetPassword: (data: any) => apiClient.post('/open/reset-password', data),
}

// 消息相关API
export const messageApi = {
  // 发送消息
  sendMessage: (messageData: any) => apiClient.post('/messages', messageData),
  
  // 获取两个用户之间的消息
  getMessagesBetweenUsers: (senderId: number, receiverId: number) => 
    apiClient.get(`/messages/between/${senderId}/${receiverId}`),
  
  // 获取未读消息
  getUnreadMessages: (userId: number) => apiClient.get(`/messages/unread/${userId}`),
  
  // 获取未读消息数量
  getUnreadMessageCount: (userId: number) => apiClient.get(`/messages/unread/count/${userId}`),
  
  // 获取特定用户之间的未读消息数量
  getUnreadMessageCountBetweenUsers: (senderId: number, receiverId: number) => 
    apiClient.get(`/messages/unread/count/${senderId}/${receiverId}`),
  
  // 标记消息已读
  markMessageAsRead: (messageId: number) => apiClient.put(`/messages/read/${messageId}`),
  
  // 标记所有消息已读
  markAllMessagesAsRead: (senderId: number, receiverId: number) => 
    apiClient.put(`/messages/read/${senderId}/${receiverId}`),
  
  // 获取消息历史
  getMessageHistory: (userId: number) => apiClient.get(`/messages/history/${userId}`),
  
  // 删除消息
  deleteMessage: (messageId: number) => apiClient.delete(`/messages/${messageId}`),
}

export default {
  userApi,
  messageApi,
}