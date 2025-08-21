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

// 定义消息类型
export interface Message {
  id: string
  text: string
  sender: 'me' | 'other'
  timestamp: Date
  userId: string
}

// 用户相关API
export const userApi = {
  // 获取所有用户
  getAllUsers: () => apiClient.get('/users'),
  
  // 根据ID获取用户
  getUserById: (id: string) => apiClient.get(`/users/${id}`),
  
  // 用户注册
  register: (userData: any) => apiClient.post('/users/register', userData),
  
  // 用户登录
  login: (credentials: any) => apiClient.post('/users/login', credentials),
  
  // 获取在线用户
  getOnlineUsers: () => apiClient.get('/users/online'),
  
  // 获取带未读数量的用户列表
  getWithUnreadCount: (userId: string) => apiClient.get(`/users/with-unread-count/${userId}`),
}

// 消息相关API
export const messageApi = {
  // 发送消息
  sendMessage: (messageData: any) => apiClient.post('/messages', messageData),
  
  // 获取两个用户之间的消息
  getMessagesBetweenUsers: (senderId: string, receiverId: string) => 
    apiClient.get(`/messages/between/${senderId}/${receiverId}`),
  
  // 获取未读消息
  getUnreadMessages: (userId: string) => apiClient.get(`/messages/unread/${userId}`),
  
  // 获取未读消息数量
  getUnreadMessageCount: (userId: string) => apiClient.get(`/messages/unread/count/${userId}`),
  
  // 获取特定用户之间的未读消息数量
  getUnreadMessageCountBetweenUsers: (senderId: string, receiverId: string) => 
    apiClient.get(`/messages/unread/count/${senderId}/${receiverId}`),
  
  // 标记消息已读
  markMessageAsRead: (messageId: string) => apiClient.put(`/messages/read/${messageId}`),
  
  // 标记所有消息已读
  markAllMessagesAsRead: (senderId: string, receiverId: string) => 
    apiClient.put(`/messages/read/${senderId}/${receiverId}`),
  
  // 获取消息历史
  getMessageHistory: (userId: string) => apiClient.get(`/messages/history/${userId}`),
  
  // 删除消息
  deleteMessage: (messageId: string) => apiClient.delete(`/messages/${messageId}`),
}

export default {
  userApi,
  messageApi,
}