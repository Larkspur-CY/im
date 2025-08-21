<template>
  <div class="chat-container">
    <UserList 
      :users="users" 
      :selected-user="selectedUser" 
      @select-user="selectUser" 
    />
    <div class="chat-window">
      <div class="chat-header">
        <h3>{{ selectedUser?.name || '请选择用户' }}</h3>
      </div>
      <MessageList :messages="messages" />
      <MessageInput 
        :selected-user="selectedUser" 
        @send-message="handleSendMessage" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import UserList from '../components/chat/UserList.vue'
import MessageList from '../components/chat/MessageList.vue'
import MessageInput from '../components/chat/MessageInput.vue'
import { useChatStore } from '../store/chatStore'
import { websocketService } from '../services/websocketService'

interface User {
  id: string
  name: string
}

interface Message {
  id: string
  text: string
  sender: 'me' | 'other'
  timestamp: Date
}

const chatStore = useChatStore()

const users = ref<User[]>([
  { id: '1', name: '用户1' },
  { id: '2', name: '用户2' },
  { id: '3', name: '用户3' }
])

const messages = ref<Message[]>([])
const selectedUser = ref<User | null>(null)

const selectUser = (user: User) => {
  selectedUser.value = user
  // 这里应该从store获取与该用户的消息历史
  messages.value = [
    { id: '1', text: '你好！', sender: 'other', timestamp: new Date() },
    { id: '2', text: '你好！有什么可以帮助你的吗？', sender: 'me', timestamp: new Date() }
  ]
}

const handleSendMessage = (messageText: string) => {
  if (messageText.trim() && selectedUser.value) {
    const message: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'me',
      timestamp: new Date()
    }
    messages.value.push(message)
    
    // 通过WebSocket发送消息
    websocketService.sendMessage({
      type: 'message',
      content: messageText,
      to: selectedUser.value.id
    })
  }
}

onMounted(() => {
  // 初始化WebSocket连接
  websocketService.connect()
})
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
}

.user-list {
  width: 250px;
  border-right: 1px solid #e0e0e0;
  padding: 20px;
}

.user-list ul {
  list-style: none;
  padding: 0;
}

.user-list li {
  padding: 10px;
  cursor: pointer;
  border-radius: 4px;
}

.user-list li:hover {
  background-color: #f0f0f0;
}

.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.message-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.message {
  margin-bottom: 10px;
}

.message-content {
  display: inline-block;
  padding: 10px;
  border-radius: 8px;
  max-width: 70%;
}

.sent {
  background-color: #0084ff;
  color: white;
  float: right;
}

.received {
  background-color: #f0f0f0;
  color: black;
  float: left;
}

.message-input {
  display: flex;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.message-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.message-input button {
  margin-left: 10px;
  padding: 10px 20px;
  background-color: #0084ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>