import { defineStore } from 'pinia'
import { ref } from 'vue'

// 引入API服务
import { userApi, messageApi } from '../services/apiService'
import type { Message } from '../services/apiService'

// 定义用户类型
interface User {
  id: number
  username: string
  nickname?: string
  email?: string
  avatar?: string
  isOnline?: boolean
  unreadCount?: number
}

// 定义WebSocket消息类型
interface WebSocketMessage {
  id?: number
  type: string
  content: string
  senderId?: number
  receiverId?: number
  sentTime?: string
  isRead?: boolean
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
    // 处理后端发送的消息
    if (!data.senderId) {
      console.error('收到的消息没有senderId:', data);
      return;
    }
    
    const senderId = data.senderId;
    const messageId = data.id;
    
    // 判断消息是否由当前用户发送
    const isSentByMe = currentUser.value && senderId == currentUser.value.id;
    
    if (isSentByMe) {
      console.log('收到自己发送的消息确认:', data);
      
      // 查找对应的待确认消息
      // 优先使用clientMessageId（如果后端返回了）
      const clientMessageId = (data as any).clientMessageId || messageId;
      if (!clientMessageId) {
        console.error('收到的确认消息没有ID:', data);
        return;
      }
      
      // 查找待确认的消息
      const messageIndex = messages.value.findIndex(m => m.id === clientMessageId && m.pending === true);
      if (messageIndex !== -1) {
        // 更新消息状态为已确认
        const updatedMessages = [...messages.value];
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          pending: false,
          confirmed: true, // 标记为已确认
          // 如果后端返回了新ID，更新消息ID（但保留原始ID用于查找）
          serverMessageId: messageId
        };
        messages.value = updatedMessages;
        console.log('消息已确认:', clientMessageId);
      } else {
        console.log('未找到待确认的消息:', clientMessageId);
      }
      return;
    }
    
    // 处理来自其他用户的消息
    // 如果消息不是当前用户发送的（即收到了其他用户的消息）
    if (currentUser.value && senderId != currentUser.value.id) {
      // 获取消息发送者的ID和接收者的ID
      const receiverId = data.receiverId;
      
      // 确保消息是发给当前用户的
      if (receiverId != currentUser.value.id) {
        console.log('收到的消息不是发给当前用户的，忽略:', {
          senderId: senderId,
          receiverId: receiverId,
          currentUserId: currentUser.value.id
        });
        return;
      }
      
      // 检查消息是否来自当前选中的用户
      if (selectedUser.value && senderId == selectedUser.value.id) {
        // 如果是当前选中的用户发来的消息，才添加到消息列表中
        const message: Message = {
          id: messageId ? messageId : Date.now(),
          text: data.content,
          sender: 'other',
          timestamp: data.sentTime ? new Date(data.sentTime) : new Date(),
          userId: senderId,
          confirmed: true // 从服务器收到的消息默认为已确认
        }
        
        console.log('处理收到的消息并添加到列表:', {
          senderId: senderId,
          currentUserId: currentUser.value?.id,
          selectedUserId: selectedUser.value.id,
          messageId: messageId
        });
        
        // 添加消息到列表
        messages.value.push(message)
        
        // 用户正在查看此对话，不增加未读消息数量
        // 重置该用户的未读消息数量
        const userIndex = users.value.findIndex(user => user.id == senderId);
        if (userIndex !== -1) {
          const updatedUsers = [...users.value];
          updatedUsers[userIndex].unreadCount = 0;
          users.value = updatedUsers;
        }
      } else {
        // 如果不是当前选中的用户发来的消息，只增加未读消息数量，不添加到当前消息列表
        console.log('收到非当前选中用户的消息，更新未读数量:', {
          senderId: senderId,
          currentSelectedUser: selectedUser.value?.id
        });
        
        const userIndex = users.value.findIndex(user => user.id == senderId);
        if (userIndex !== -1) {
          const updatedUsers = [...users.value];
          updatedUsers[userIndex].unreadCount = (updatedUsers[userIndex].unreadCount || 0) + 1;
          users.value = updatedUsers;
        }
      }
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
  async function fetchUsers(withUnreadCount: boolean = false) {
    try {
      if (withUnreadCount) {
        // 使用axios获取带未读数量的用户数据
        const response = await userApi.getWithUnreadCount();
        
        // 处理带未读数量的用户数据
        users.value = response.data.map((item: any) => ({
          id: item.user.id,
          username: item.user.username,
          nickname: item.user.nickname,
          email: item.user.email,
          avatar: item.user.avatar,
          isOnline: item.user.isOnline,
          unreadCount: item.unreadCount
        }));
      } else {
        // 使用axios获取普通用户数据
        const response = await userApi.getAllUsers();
        
        // 处理普通用户数据
        users.value = response.data.map((user: any) => ({
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          avatar: user.avatar,
          isOnline: user.isOnline
        }));
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  }
  
  // 获取在线用户
  // async function fetchOnlineUsers() {
  //   try {
  //     const response = await userApi.getOnlineUsers();
  //     return response.data.map((user: any) => ({
  //       id: user.id,
  //       name: user.nickname || user.username,
  //       avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`,
  //       status: 'online',
  //       unreadCount: 0
  //     }));
  //   } catch (error) {
  //     console.error('获取在线用户列表失败:', error);
  //     return [];
  //   }
  // }
  
  // 从后端获取两个用户之间的消息
  async function fetchMessagesBetweenUsers(senderId: number, receiverId: number) {
    try {
      const response = await messageApi.getMessagesBetweenUsers(senderId, receiverId);
      messages.value = response.data.map((msg: any) => ({
        id: msg.id,
        text: msg.content,
        // 判断消息是否由当前用户发送
        // 如果senderId等于当前用户ID，则是当前用户发送的消息
        sender: msg.senderId == currentUser.value?.id ? 'me' : 'other',
        timestamp: new Date(msg.sentTime),
        userId: msg.senderId
      }));
      
      console.log('获取消息:', {
        messages: messages.value,
        currentUserId: currentUser.value?.id
      });
      
      // 重置对应用户的未读消息数量
      const userIndex = users.value.findIndex(user => user.id == receiverId);
      if (userIndex !== -1) {
        const updatedUsers = [...users.value];
        updatedUsers[userIndex].unreadCount = 0;
        users.value = updatedUsers;
      }
      
      // 获取并更新发送者的未读消息数量
      const unreadResponse = await messageApi.getUnreadMessageCountBetweenUsers(receiverId, senderId);
      const senderUserIndex = users.value.findIndex(user => user.id == senderId);
      if (senderUserIndex !== -1) {
        const updatedUsers = [...users.value];
        updatedUsers[senderUserIndex].unreadCount = unreadResponse.data;
        users.value = updatedUsers;
      }
    } catch (error) {
      console.error('获取消息失败:', error);
    }
  }
  
  // 发送消息到后端
  async function sendNewMessage(messageData: any) {
    try {
      const response = await messageApi.sendMessage(messageData);
      return response.data;
    } catch (error) {
      console.error('发送消息失败:', error);
      throw error;
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