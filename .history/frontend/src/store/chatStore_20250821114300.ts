import { defineStore } from 'pinia'
import { ref } from 'vue'

type User = {
  id: string
  name: string
}

type Message = {
  id: string
  text: string
  sender: 'me' | 'other'
  timestamp: Date
  userId: string
}

type WebSocketMessage = {
  type: string
  content: string
  from?: string
  to?: string
}

export const useChatStore = defineStore('chat', () => {
  // 用户列表
  const users = ref<User[]>([
    { id: '1', name: '用户1' },
    { id: '2', name: '用户2' },
    { id: '3', name: '用户3' }
  ])
  
  // 消息列表
  const messages = ref<Message[]>([])
  
  // 当前选中的用户
  const selectedUser = ref<User | null>(null)
  
  // WebSocket连接状态
  const isConnected = ref(false)
  
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
  
  return { 
    users, 
    messages, 
    selectedUser, 
    isConnected,
    setSelectedUser, 
    addMessage, 
    handleWebSocketMessage,
    setConnectionStatus,
    clearMessages
  }
})