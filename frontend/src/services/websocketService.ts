import { useChatStore } from '../store/chatStore'
import SockJS from 'sockjs-client'

export class WebSocketService {
  private ws: WebSocket | null = null
  private url: string
  private reconnectInterval = 5000
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  
  constructor(url: string) {
    this.url = url
  }
  
  connect() {
    try {
      // 使用SockJS建立连接
      this.ws = new SockJS(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket连接已建立')
        this.reconnectAttempts = 0
        // 在store中更新连接状态
        const chatStore = useChatStore()
        chatStore.setConnectionStatus(true)
      }
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        console.log('收到消息:', data)
        // 处理接收到的消息
        const chatStore = useChatStore()
        
        // 处理未读消息数量更新
        if (data.type === 'unread-count') {
          const senderId = data.senderId;
          const unreadCount = data.unreadCount;
          const userIndex = chatStore.users.findIndex(user => user.id === senderId);
          
          if (userIndex !== -1) {
            const updatedUsers = [...chatStore.users];
            updatedUsers[userIndex].unreadCount = unreadCount;
            chatStore.users = updatedUsers;
          }
        }
        // 处理在线用户状态变更
        else if (data.type === 'online-users') {
          const onlineUserIds = new Set(data.content.map((user: any) => user.id.toString()));
          const updatedUsers = chatStore.users.map(user => ({
            ...user,
            status: onlineUserIds.has(user.id) ? 'online' : 'offline'
          }));
          chatStore.users = updatedUsers;
        } else {
          // 处理普通消息
          chatStore.handleWebSocketMessage(data)
          
          // 如果消息来自其他用户且当前未选中该用户，则增加未读消息计数
          if (data.type === 'message' && data.from && chatStore.currentUser && data.from !== chatStore.currentUser.id) {
            const senderId = data.from;
            const userIndex = chatStore.users.findIndex(user => user.id === senderId);
            
            if (userIndex !== -1) {
              // 如果当前未选中该用户或选中的不是发送消息的用户，则增加未读计数
              if (!chatStore.selectedUser || chatStore.selectedUser.id !== senderId) {
                const updatedUsers = [...chatStore.users];
                const user = updatedUsers[userIndex];
                user.unreadCount = (user.unreadCount || 0) + 1;
                chatStore.users = updatedUsers;
              }
            }
          }
        }
      }
      
      this.ws.onclose = () => {
        console.log('WebSocket连接已关闭')
        // 在store中更新连接状态
        const chatStore = useChatStore()
        chatStore.setConnectionStatus(false)
        
        // 尝试重连
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          setTimeout(() => this.connect(), this.reconnectInterval)
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('WebSocket错误:', error)
      }
    } catch (error) {
      console.error('WebSocket连接失败:', error)
    }
  }
  
  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket未连接')
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// 创建WebSocket服务实例
export const websocketService = new WebSocketService('http://localhost:8080/ws')