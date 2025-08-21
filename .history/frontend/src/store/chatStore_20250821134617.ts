import { defineStore } from 'pinia'
import { ref } from 'vue'

// 引入API服务
import { userApi, messageApi } from '../services/apiService'

// 定义用户类型
interface User {
  id: string
  username: string
  nickname?: string
  email?: string
  avatar?: string
  isOnline?: boolean
}

// 定义消息类型
interface Message {
  id: string
  text: string
  sender: 'me' | 'other'
  timestamp: Date
  userId: string
}

// 定义WebSocket消息类型
interface WebSocketMessage {
  type: string
  content: string
  from?: string
  to?: string
}

export const useChatStore = defineStore('chat', () => {
  // 用户列表
  const users = ref<User[]>([])
  
  // 消息列表
  const messages = ref<Message[]>([])
  
  // 当前选中的用户
  const selectedUser = ref<User | null>(null)
  
  // WebSocket连接状态
  const isConnected = ref(false)
  
  // 当前用户（模拟登录用户）
  const currentUser = ref<User | null>(null)
  
  // 设置当前用户
  function setCurrentUser(user: User) {
    currentUser.value = user
  }
  
  // 设置选中的用户
  function setSelectedUser(user: User | null) {
    selectedUser.value = user
  }
  
  // 添加消息
  function addMessage(message: Message) {
    messages.value.push(message)
  }
  
  // 处理WebSocket消息
  function handleWebSocketMessage(data: WebSocketMessage) {
    if (data.type === 'message') {
      const message: Message = {
        id: Date.now().toString(),
        text: data.content,
        sender: 'other',
        timestamp: new Date(),
        userId: data.from || ''
      }
      messages.value.push(message)
    }
  }
  
  // 设置连接状态
  function setConnectionStatus(status: boolean) {
    isConnected.value = status
  }
  
  // 清除所有消息
  function clearMessages() {
    messages.value = []
  }
  
  // 从后端获取用户列表
  async function fetchUsers() {
    try {
      const response = await userApi.getAllUsers()
      users.value = response.data.map((user: any) => ({
        id: user.id.toString(),
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline
      }))
    } catch (error) {
      console.error('获取用户列表失败:', error)
    }
  }
  
  // 从后端获取两个用户之间的消息
  async function fetchMessagesBetweenUsers(senderId: string, receiverId: string) {
    try {
      const response = await messageApi.getMessagesBetweenUsers(senderId, receiverId)
      messages.value = response.data.map((msg: any) => ({
        id: msg.id.toString(),
        text: msg.content,
        sender: msg.senderId.toString() === currentUser.value?.id ? 'me' : 'other',
        timestamp: new Date(msg.sentTime),
        userId: msg.senderId.toString()
      }))
    } catch (error) {
      console.error('获取消息失败:', error)
    }
  }
  
  // 发送消息到后端
  async function sendNewMessage(messageData: any) {
    try {
      const response = await messageApi.sendMessage(messageData)
      return response.data
    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    }
  }
  
  return { 
    users, 
    messages, 
    selectedUser, 
    isConnected,
    currentUser,
    setCurrentUser,
    setSelectedUser, 
    addMessage, 
    handleWebSocketMessage,
    setConnectionStatus,
    clearMessages,
    fetchUsers,
    fetchMessagesBetweenUsers,
    sendNewMessage
  }
})