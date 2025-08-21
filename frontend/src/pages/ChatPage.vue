<template>
  <div class="chat-container">
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
import { useChatStore } from '../store/chatStore'
import { websocketService } from '../services/websocketService'
import { messageApi } from '../services/apiService'
import type { Message } from '../services/apiService'
import '../assets/chat.css'

const chatStore = useChatStore()

// 模拟登录用户（实际应用中应该从登录接口获取）
const mockCurrentUser = {
  id: '1',
  username: 'admin',
  nickname: '管理员'
}

const selectUser = async (user: any) => {
  chatStore.setSelectedUser(user)
  
  // 标记所有消息为已读
  if (chatStore.currentUser) {
    try {
      await messageApi.markAllMessagesAsRead(user.id, chatStore.currentUser.id);
    } catch (error) {
      console.error('标记消息为已读失败:', error);
    }
    
    // 获取两个用户之间的消息历史
    await chatStore.fetchMessagesBetweenUsers(chatStore.currentUser.id, user.id)
  }
  
  // 重置该用户的未读消息数量
  const userIndex = chatStore.users.findIndex(u => u.id === user.id);
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
    // 创建消息对象
    const messageToSend = {
      type: 'TEXT',
      content: messageText,
      receiverId: chatStore.selectedUser.id,
      senderId: chatStore.currentUser.id
    }
    
    // 先通过WebSocket发送消息（实时显示）
    websocketService.sendMessage(messageToSend)
    
    // 将自己发送的消息添加到消息列表中
    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'me',
      timestamp: new Date(),
      userId: chatStore.currentUser.id
    }
    chatStore.addMessage(newMessage)
  }
}

onMounted(async () => {
  // 设置当前用户
  chatStore.setCurrentUser(mockCurrentUser)
  
  // 获取用户列表（带未读消息数量）
  await chatStore.fetchUsers(mockCurrentUser.id)
  
  // 初始化WebSocket连接
  websocketService.connect()
  
  // 添加错误事件监听器
  window.addEventListener('websocketError', handleWebSocketError as EventListener);
})

onUnmounted(() => {
  // 移除错误事件监听器
  window.removeEventListener('websocketError', handleWebSocketError as EventListener);
})
</script>

<style scoped>
/* 所有样式已移至 chat.css 文件中，以确保全局一致性和避免重复 */
</style>