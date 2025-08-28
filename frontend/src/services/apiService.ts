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
  pending?: boolean
  confirmed?: boolean
  serverMessageId?: number // 服务器生成的消息ID
  readStatus?: boolean  // 消息是否已读
}


// 无权限相关API
export const openApi = {
  
  // 用户注册
  register: (userData: any) => apiClient.post('/open/register', userData),
  
  // 用户登录
  login: (credentials: any) => apiClient.post('/open/login', credentials),
  
  // 验证用户邮箱（用于忘记密码）
  verifyUserEmail: (data: any) => apiClient.post('/open/verify-email', data),
  
  // 重置密码
  resetPassword: (data: any) => apiClient.post('/open/reset-password', data),
}

// 用户相关API
export const userApi = {
  // 获取所有用户
  getAllUsers: () => apiClient.get('/users'),
  
  // 根据ID获取用户
  getUserById: (id: number) => apiClient.get(`/users/${id}`),
  
  // 获取在线用户
  getOnlineUsers: () => apiClient.get('/users/online'),
  
  // 获取带未读数量的用户列表
  getWithUnreadCount: () => apiClient.get('/users/with-unread-count'),

  // 验证密码
  verifyPassword: (data: { password: string }) => {
    return apiClient.post('/users/verify-password', data)
  },

  // 更新用户信息
  updateUser: (data: { nickname?: string; avatar?: string; showReadStatus?: boolean }) => {
    return apiClient.put(`/users/updateUser`, data)
  },
  
  // 修改密码
  changePassword: (data: {  email?: string; oldPassword: string; newPassword: string }) => {
    return apiClient.put(`/users/change-password`, data)
  },
  
  // 设置用户离线状态
  setUserOffline: (userId: number) => {
    return apiClient.put(`/users/${userId}/offline`)
  },
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