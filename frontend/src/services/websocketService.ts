import { useChatStore } from '../store/chatStore'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import type { IMessage } from '@stomp/stompjs'

export class WebSocketService {
  private stompClient: Client | null = null
  private url: string
  private reconnectInterval = 5000
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  
  constructor(url: string) {
    this.url = url
  }
  
  connect() {
    try {
      // 使用SockJS和STOMP建立连接
      const socket = new SockJS(this.url);
      
      // 获取认证token
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      this.stompClient = new Client({
        webSocketFactory: () => socket,
        connectHeaders: headers,
        reconnectDelay: this.reconnectInterval,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log('STOMP连接已建立')
          this.reconnectAttempts = 0
          // 在store中更新连接状态
          const chatStore = useChatStore()
          chatStore.setConnectionStatus(true)
          
          // 订阅用户消息队列
          this.stompClient?.subscribe('/user/queue/messages', (message: IMessage) => {
            const data = JSON.parse(message.body)
            console.log('收到消息:', data)
            // 处理接收到的消息
            const chatStore = useChatStore()
            chatStore.handleWebSocketMessage(data)
            
            // 如果消息来自其他用户且当前未选中该用户，则增加未读消息计数
            if (data.from && chatStore.currentUser && data.from !== chatStore.currentUser.id) {
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
          });
          
          // 订阅未读消息数量更新
          this.stompClient?.subscribe('/user/queue/unread-count', (message: IMessage) => {
            const data = JSON.parse(message.body);
            const senderId = data.senderId;
            const unreadCount = data.unreadCount;
            const chatStore = useChatStore();
            const userIndex = chatStore.users.findIndex(user => user.id === senderId);
            
            if (userIndex !== -1) {
              const updatedUsers = [...chatStore.users];
              updatedUsers[userIndex].unreadCount = unreadCount;
              chatStore.users = updatedUsers;
            }
          });
          
          // 订阅在线用户状态变更
          this.stompClient?.subscribe('/topic/online-users', (message: IMessage) => {
            const data = JSON.parse(message.body);
            const chatStore = useChatStore();
            const onlineUserIds = new Set(data.content.map((user: any) => user.id.toString()));
            const updatedUsers = chatStore.users.map(user => ({
              ...user,
              status: onlineUserIds.has(user.id) ? 'online' : 'offline'
            }));
            chatStore.users = updatedUsers;
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
        },
        onDisconnect: () => {
          console.log('STOMP连接已关闭')
          // 在store中更新连接状态
          const chatStore = useChatStore()
          chatStore.setConnectionStatus(false)
          
          // 尝试重连
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            setTimeout(() => this.connect(), this.reconnectInterval)
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
  
  sendMessage(message: any) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({ destination: '/app/chat.sendMessage', body: JSON.stringify(message) });
    } else {
      console.error('STOMP未连接')
    }
  }
  
  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate()
      this.stompClient = null
    }
  }
}

// 创建WebSocket服务实例
export const websocketService = new WebSocketService('http://localhost:8080/ws')