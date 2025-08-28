import { useChatStore } from '../store/chatStore'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import type { IMessage } from '@stomp/stompjs'

export class WebSocketService {
  private stompClient: Client | null = null
  private url: string
  private reconnectInterval = 5000
  private reconnectAttempts = 0
  private maxReconnectAttempts = Infinity // 无限重连尝试
  private heartbeatTimer: number | null = null
  private heartbeatInterval = 30000 // 30秒发送一次心跳
  private connectionWatchdog: number | null = null
  private connectionTimeout = 10000 // 10秒连接超时
  private lastHeartbeatReceived: number = 0 // 最后一次收到心跳的时间戳
  private heartbeatCheckTimer: number | null = null // 心跳检查定时器
  private heartbeatMaxDelay = 90000 // 心跳最大延迟时间（90秒）
  
  constructor(url: string) {
    this.url = url
    // 监听窗口的在线/离线状态
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
  }
  
  private handleOnline() {
    console.log('网络已恢复，尝试重新连接WebSocket')
    this.reconnect()
  }
  
  private handleOffline() {
    console.log('网络已断开，停止WebSocket连接')
    this.stopHeartbeat()
    // 不主动断开连接，等待网络恢复
  }
  
  private handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      console.log('页面可见，检查WebSocket连接')
      this.checkConnection()
    }
  }
  
  private checkConnection() {
    if (!this.stompClient || !this.stompClient.connected) {
      console.log('WebSocket连接已断开，尝试重新连接')
      this.reconnect()
    }
  }
  
  connect() {
    try {
      // 清除之前的连接监视器
      if (this.connectionWatchdog) {
        clearTimeout(this.connectionWatchdog)
      }
      
      // 设置连接超时监视器
      this.connectionWatchdog = window.setTimeout(() => {
        console.log('WebSocket连接超时，尝试重新连接')
        this.reconnect()
      }, this.connectionTimeout) as unknown as number
      
      // 获取认证token
      const token = localStorage.getItem('token');
      
      // 创建自定义的SockJS实例，添加token到请求头
      const socket = new SockJS(this.url);
      
      // 准备STOMP连接头，包含Authorization
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      this.stompClient = new Client({
        webSocketFactory: () => socket,
        connectHeaders: headers,  // 这里传递token到连接头
        reconnectDelay: this.reconnectInterval,
        heartbeatIncoming: 10000, // 增加心跳间隔
        heartbeatOutgoing: 10000, // 增加心跳间隔
        debug: (msg) => {
          // 避免使用process.env，直接禁用调试日志
          // 如果需要调试，可以设置为true
          const enableDebug = false;
          if (enableDebug) {
            console.debug(msg)
          }
        },
        onConnect: () => {
          console.log('STOMP连接已建立')
          this.reconnectAttempts = 0
          
          // 清除连接超时监视器
          if (this.connectionWatchdog) {
            clearTimeout(this.connectionWatchdog)
            this.connectionWatchdog = null
          }
          
          // 在store中更新连接状态
          const chatStore = useChatStore()
          chatStore.setConnectionStatus(true)
          
          // 启动心跳机制
          this.startHeartbeat()
          
          // 连接建立后，显式添加用户到会话
          // 这将触发用户上线通知
          this.addUser()
          
          // 订阅用户消息队列
          this.stompClient?.subscribe('/user/queue/messages', (message: IMessage) => {
            const data = JSON.parse(message.body)
            console.log('收到消息:', data)
            // 处理接收到的消息
            const chatStore = useChatStore()
            chatStore.handleWebSocketMessage(data)
          });
          
          // 订阅未读消息数量更新
          this.stompClient?.subscribe('/user/queue/unread-count', (message: IMessage) => {
            const data = JSON.parse(message.body);
            const senderId = data.senderId;
            const unreadCount = data.unreadCount;
            const chatStore = useChatStore();
            const userIndex = chatStore.users.findIndex(user => user.id == senderId);
            
            // 检查当前用户是否正在查看该发送者的聊天界面
            const currentChatUser = chatStore.selectedUser;
            
            // 如果当前正在查看该发送者的聊天界面，则不更新未读消息数量
            if (userIndex !== -1 && (!currentChatUser || currentChatUser.id !== senderId)) {
              const updatedUsers = [...chatStore.users];
              updatedUsers[userIndex].unreadCount = unreadCount;
              chatStore.users = updatedUsers;
            }
          });
          
          // 订阅在线用户状态变更
          this.stompClient?.subscribe('/topic/online-users', (message: IMessage) => {
            const data = JSON.parse(message.body);
            const chatStore = useChatStore();
            
            // 确保data是一个数组
            if (Array.isArray(data)) {
              const onlineUserIds = new Set(data.map((user: any) => user.id));
              const updatedUsers = chatStore.users.map(user => ({
                ...user,
                status: onlineUserIds.has(user.id) ? 'online' : 'offline'
              }));
              chatStore.users = updatedUsers;
            } else {
              console.error('收到的在线用户数据格式不正确:', data);
            }
          });
          
          // 订阅错误消息队列
          this.stompClient?.subscribe('/user/queue/errors', (message: IMessage) => {
            const data = JSON.parse(message.body);
            console.error('收到错误消息:', data);
            // 可以在这里添加全局错误处理逻辑，比如显示通知
            // 例如，使用一个全局的事件总线或者状态管理来通知组件
            const event = new CustomEvent('websocketError', { detail: data });
            window.dispatchEvent(event);
          });
          
          // 订阅专门的心跳确认队列
          this.stompClient?.subscribe('/user/queue/heartbeat', (message: IMessage) => {
            const data = JSON.parse(message.body);
            console.log('收到心跳确认:', data.timestamp);
            
            // 更新最后一次心跳时间
            this.lastHeartbeatReceived = Date.now();
            
            // 确保连接状态为已连接
            const chatStore = useChatStore();
            if (!chatStore.isConnected) {
              console.log('通过心跳确认恢复连接状态');
              chatStore.setConnectionStatus(true);
              // 不在这里调用addUser，避免重复处理
            }
          });
          
          // 订阅已读回执队列
          this.stompClient?.subscribe('/user/queue/read-receipts', (message: IMessage) => {
            const data = JSON.parse(message.body);
            console.log('收到已读回执:', data);
            
            // 获取读取者ID和时间戳
            const readerId = data.readerId;
            const timestamp = data.timestamp;
            
            // 更新消息的已读状态
            const chatStore = useChatStore();
            
            // 如果当前选中的用户就是已读回执的发送者
            if (chatStore.selectedUser && chatStore.selectedUser.id === readerId) {
              console.log(`用户 ${readerId} 已读取了您的消息`);
              
              // 这里可以更新UI，显示消息已读状态
              // 例如，可以添加一个事件，让UI组件知道消息已被读取
              const event = new CustomEvent('messagesRead', { 
                detail: { 
                  readerId: readerId,
                  timestamp: timestamp
                } 
              });
              window.dispatchEvent(event);
            }
          });
        },
        onDisconnect: () => {
          console.log('STOMP连接已关闭')
          // 在store中更新连接状态
          const chatStore = useChatStore()
          chatStore.setConnectionStatus(false)
          
          // 停止心跳
          this.stopHeartbeat()
          
          // 指数退避重连策略
          const reconnectDelay = Math.min(30000, this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts))
          console.log(`将在 ${reconnectDelay/1000} 秒后尝试第 ${this.reconnectAttempts + 1} 次重连`)
          
          // 尝试重连
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            setTimeout(() => this.reconnect(), reconnectDelay)
          }
        },
        onStompError: (frame) => {
          console.error('STOMP错误:', frame.headers['message'])
          console.error('详细错误:', frame.body)
        }
      });
      
      this.stompClient.activate();
    } catch (error) {
      console.error('STOMP连接失败:', error)
    }
  }
  
  // 启动心跳机制
  private startHeartbeat() {
    this.stopHeartbeat() // 先清除之前的心跳
    
    // 记录初始心跳时间
    this.lastHeartbeatReceived = Date.now()
    
    // 发送心跳的定时器
    this.heartbeatTimer = window.setInterval(() => {
      this.sendHeartbeat()
    }, this.heartbeatInterval) as unknown as number
    
    // 检查心跳的定时器
    this.heartbeatCheckTimer = window.setInterval(() => {
      this.checkHeartbeat()
    }, this.heartbeatInterval) as unknown as number
  }
  
  // 停止心跳机制
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    
    if (this.heartbeatCheckTimer) {
      clearInterval(this.heartbeatCheckTimer)
      this.heartbeatCheckTimer = null
    }
  }
  
  // 检查心跳状态
  private checkHeartbeat() {
    const now = Date.now()
    const timeSinceLastHeartbeat = now - this.lastHeartbeatReceived
    
    // 如果超过最大心跳延迟时间，认为连接已断开
    if (timeSinceLastHeartbeat > this.heartbeatMaxDelay) {
      console.warn(`心跳超时 (${timeSinceLastHeartbeat}ms)，尝试重新连接`)
      
      // 获取聊天存储
      const chatStore = useChatStore()
      
      // 如果当前状态是已连接，则更新为未连接
      if (chatStore.isConnected) {
        chatStore.setConnectionStatus(false)
      }
      
      // 尝试重新连接
      this.reconnect()
    }
  }
  
  // 发送心跳包
  private sendHeartbeat() {
    if (this.stompClient && this.stompClient.connected) {
      console.log('发送心跳包')
      this.stompClient.publish({ 
        destination: '/app/chat.heartbeat', 
        body: JSON.stringify({ timestamp: new Date().getTime() }) 
      })
    } else {
      console.warn('心跳检测到WebSocket未连接，尝试重连')
      this.reconnect()
    }
  }
  
  // 重连方法
  private reconnect() {
    // 先断开现有连接
    if (this.stompClient) {
      try {
        this.stompClient.deactivate()
      } catch (e) {
        console.error('断开现有连接时出错:', e)
      }
      this.stompClient = null
    }
    
    // 重新连接
    console.log('正在重新连接WebSocket...')
    this.connect()
  }
  
  sendMessage(message: any) {
    if (this.stompClient && this.stompClient.connected) {
      // 不再手动添加senderId，让后端从token中解析
      this.stompClient.publish({ destination: '/app/chat.sendMessage', body: JSON.stringify(message) });
    } else {
      console.error('STOMP未连接，消息将被缓存并在重连后发送')
      // 存储消息并在重连后发送
      this.reconnect()
      // 可以在这里添加消息缓存逻辑
    }
  }
  
  // 添加用户到WebSocket会话
  addUser() {
    if (this.stompClient && this.stompClient.connected) {
      const message = {
        type: 'JOIN'
      }
      this.stompClient.publish({ destination: '/app/chat.addUser', body: JSON.stringify(message) });
    } else {
      console.error('STOMP未连接，无法添加用户')
    }
  }
  
  // 标记与特定用户的消息为已读
  markMessagesAsRead(userId: number | string) {
    if (this.stompClient && this.stompClient.connected) {
      const message = {
        senderId: userId
      }
      this.stompClient.publish({ 
        destination: '/app/chat.markAsRead', 
        body: JSON.stringify(message) 
      });
      console.log(`已发送标记来自用户 ${userId} 的消息为已读的请求`);
    } else {
      console.error('STOMP未连接，无法标记消息为已读')
      this.reconnect()
    }
  }
  
  disconnect() {
    // 停止心跳
    this.stopHeartbeat()
    
    // 清除连接监视器
    if (this.connectionWatchdog) {
      clearTimeout(this.connectionWatchdog)
      this.connectionWatchdog = null
    }
    
    // 移除事件监听器
    window.removeEventListener('online', this.handleOnline.bind(this))
    window.removeEventListener('offline', this.handleOffline.bind(this))
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    
    // 断开连接
    if (this.stompClient) {
      this.stompClient.deactivate()
      this.stompClient = null
    }
  }
}

// 创建WebSocket服务实例
export const websocketService = new WebSocketService('http://localhost:8080/ws')