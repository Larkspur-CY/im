import { useChatStore } from '../store/chatStore'

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
      this.ws = new WebSocket(this.url)
      
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
        chatStore.handleWebSocketMessage(data)
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
export const websocketService = new WebSocketService('ws://localhost:8080/chat')