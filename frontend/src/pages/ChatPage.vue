<template>
  <div class="chat-container">
    <ThemeToggle />
    <UserList 
      :users="chatStore.users" 
      :selected-user="chatStore.selectedUser" 
      @select-user="selectUser" 
    />
    <div class="chat-window">
      <div class="chat-header" v-if="chatStore.selectedUser">
        <h3>{{ chatStore.selectedUser.username }}</h3>
      </div>
      <MessageList :messages="chatStore.messages" />
      <MessageInput 
        :selected-user="chatStore.selectedUser" 
        @send-message="handleSendMessage" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import UserList from '../components/chat/UserList.vue'
import MessageList from '../components/chat/MessageList.vue'
import MessageInput from '../components/chat/MessageInput.vue'
import ThemeToggle from '../components/ThemeToggle.vue'
import { useChatStore } from '../store/chatStore'
import { websocketService } from '../services/websocketService'
import type { Message } from '../services/apiService'
import '../assets/chat.css'

const chatStore = useChatStore()

// 导入路由和认证服务
import { authService } from '../services/authService'
import { useRouter } from 'vue-router'

const router = useRouter()

const selectUser = async (user: any) => {
  chatStore.setSelectedUser(user)
  
  // 标记所有消息为已读（使用WebSocket）
  if (chatStore.currentUser) {
    // 使用WebSocket标记消息为已读
    websocketService.markMessagesAsRead(user.id);
    
    // 获取两个用户之间的消息历史
    await chatStore.fetchMessagesBetweenUsers(chatStore.currentUser.id, user.id)
  }
  
  // 重置该用户的未读消息数量
  const userIndex = chatStore.users.findIndex(u => u.id == user.id);
  if (userIndex !== -1) {
    const updatedUsers = [...chatStore.users];
    updatedUsers[userIndex].unreadCount = 0;
    chatStore.users = updatedUsers;
  }
}

// 处理WebSocket错误消息
const handleWebSocketError = (event: CustomEvent) => {
  const errorData = event.detail;
  console.error('WebSocket错误:', errorData);
  
  // 查找最后发送的消息并标记为错误
  const messages = chatStore.messages;
  if (messages.length > 0) {
    // 找到最后一条由当前用户发送的消息
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.sender === 'me' && !message.error) {
        // 更新消息状态为错误
        const updatedMessages = [...messages];
        updatedMessages[i] = {
          ...message,
          error: true,
          errorMessage: errorData.message
        };
        chatStore.messages = updatedMessages;
        break;
      }
    }
  }
  
  // 显示错误通知给用户
  console.error(`消息发送失败: ${errorData.message}`);
};

const handleSendMessage = async (messageText: string) => {
  if (messageText.trim() && chatStore.selectedUser && chatStore.currentUser) {
    // 生成唯一消息ID
    const messageId = Date.now();
    
    // 创建消息对象
    const messageToSend = {
      id: messageId, // 添加ID到发送的消息中
      type: 'TEXT',
      content: messageText,
      receiverId: chatStore.selectedUser.id,
      senderId: chatStore.currentUser.id
    }
    
    // 将自己发送的消息添加到消息列表中
    const newMessage: Message = {
      id: messageId,
      text: messageText,
      sender: 'me',
      timestamp: new Date(),
      userId: chatStore.currentUser.id,
      pending: true // 标记为待确认状态
    }
    chatStore.addMessage(newMessage)
    
    // 先通过WebSocket发送消息
    try {
      websocketService.sendMessage(messageToSend)
      
      // 设置超时检测
      setTimeout(() => {
        // 查找这条消息是否仍然处于待确认状态
        const messageIndex = chatStore.messages.findIndex(m => m.id === messageId && m.pending === true);
        if (messageIndex !== -1) {
          // 如果超时仍未收到确认，标记为发送失败
          const updatedMessages = [...chatStore.messages];
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            pending: false,
            error: true,
            errorMessage: "消息发送超时，请检查网络连接"
          };
          chatStore.messages = updatedMessages;
        }
      }, 10000); // 10秒超时
    } catch (error) {
      console.error('发送消息失败:', error);
      // 立即标记为发送失败
      const messageIndex = chatStore.messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        const updatedMessages = [...chatStore.messages];
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          pending: false,
          error: true,
          errorMessage: "消息发送失败"
        };
        chatStore.messages = updatedMessages;
      }
    }
  }
}

// 重试发送失败的消息
const retryMessage = (messageId: number) => {
  // 查找失败的消息
  const messageIndex = chatStore.messages.findIndex(m => m.id === messageId && m.error === true);
  if (messageIndex !== -1) {
    const message = chatStore.messages[messageIndex];
    
    // 更新消息状态为待确认
    const updatedMessages = [...chatStore.messages];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      pending: true,
      error: false,
      errorMessage: undefined
    };
    chatStore.messages = updatedMessages;
    
    // 重新发送消息
    const messageToSend = {
      id: message.id,
      type: 'TEXT',
      content: message.text,
      receiverId: chatStore.selectedUser?.id,
      senderId: chatStore.currentUser?.id
    }
    
    try {
      websocketService.sendMessage(messageToSend);
      
      // 设置超时检测
      setTimeout(() => {
        // 查找这条消息是否仍然处于待确认状态
        const msgIndex = chatStore.messages.findIndex(m => m.id === messageId && m.pending === true);
        if (msgIndex !== -1) {
          // 如果超时仍未收到确认，标记为发送失败
          const updatedMsgs = [...chatStore.messages];
          updatedMsgs[msgIndex] = {
            ...updatedMsgs[msgIndex],
            pending: false,
            error: true,
            errorMessage: "消息发送超时，请检查网络连接"
          };
          chatStore.messages = updatedMsgs;
        }
      }, 10000); // 10秒超时
    } catch (error) {
      console.error('重试发送消息失败:', error);
      // 立即标记为发送失败
      const msgIndex = chatStore.messages.findIndex(m => m.id === messageId);
      if (msgIndex !== -1) {
        const updatedMsgs = [...chatStore.messages];
        updatedMsgs[msgIndex] = {
          ...updatedMsgs[msgIndex],
          pending: false,
          error: true,
          errorMessage: "消息重试失败"
        };
        chatStore.messages = updatedMsgs;
      }
    }
  }
}

// 处理重试消息事件
const handleRetryMessage = (event: CustomEvent) => {
  const { messageId } = event.detail;
  retryMessage(messageId);
};

onMounted(async () => {
  // 获取并设置当前用户
  const authUser = authService.getCurrentUser()
  
  if (authUser) {
    // 将 authService 的 User 类型转换为 chatStore 使用的 User 类型
    const userForStore = {
      id: authUser.id, // 直接使用 number 类型
      username: authUser.username,
      nickname: authUser.nickname || '',
      email: authUser.email
    }
    
    // 设置当前用户
    chatStore.setCurrentUser(userForStore)
    
    // 获取用户列表（带未读消息数量）
    await chatStore.fetchUsers(true)
  } else {
    console.error('用户未登录')
    // 重定向到登录页面
    router.push('/login')
  }
  
  // 初始化WebSocket连接
  websocketService.connect()
  
  // 添加错误事件监听器
  window.addEventListener('websocketError', handleWebSocketError as EventListener);
  
  // 添加重试消息事件监听器
  window.addEventListener('retryMessage', handleRetryMessage as EventListener);
})

onUnmounted(() => {
  // 移除错误事件监听器
  window.removeEventListener('websocketError', handleWebSocketError as EventListener);
  
  // 移除重试消息事件监听器
  window.removeEventListener('retryMessage', handleRetryMessage as EventListener);
})
</script>