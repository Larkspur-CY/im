<template>
  <div class="chat-container">
    <UserList 
      :users="chatStore.users" 
      :selected-user="chatStore.selectedUser" 
      @select-user="selectUser" 
    />
    <div class="chat-window">
      <div class="chat-header" v-if="chatStore.selectedUser">
        <h3>{{ chatStore.selectedUser.name }}</h3>
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
import { onMounted } from 'vue'
import UserList from '../components/chat/UserList.vue'
import MessageList from '../components/chat/MessageList.vue'
import MessageInput from '../components/chat/MessageInput.vue'
import { useChatStore } from '../store/chatStore'
import { websocketService } from '../services/websocketService'
import '../assets/chat.css'

const chatStore = useChatStore()

const selectUser = (user: any) => {
  chatStore.setSelectedUser(user)
}

const handleSendMessage = (messageText: string) => {
  if (messageText.trim() && chatStore.selectedUser) {
    // 通过WebSocket发送消息
    websocketService.sendMessage({
      type: 'message',
      content: messageText,
      to: chatStore.selectedUser.id
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