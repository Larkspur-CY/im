<template>
  <div class="message-list" ref="messageList">
    <div 
      v-for="message in messages" 
      :key="message.id" 
      class="message"
      :class="{ 'sent-message': message.sender === 'me', 'received-message': message.sender !== 'me' }"
    >
      <div class="message-header" v-if="message.sender !== 'me'">
        <span class="message-time">{{ formatTime(message.timestamp) }}</span>
      </div>
      <div class="message-header sent-header" v-if="message.sender === 'me'">
        <span class="message-time">{{ formatTime(message.timestamp) }}</span>
      </div>
      <div class="message-row">
        <div class="avatar-container" v-if="message.sender !== 'me'">
          <div class="avatar">
            {{ getUserInitial(message.userId) }}
          </div>
        </div>
        <div :class="['message-content', message.sender === 'me' ? 'sent' : 'received', { 'error': message.error }]">
          {{ message.text }}
        </div>
        <div class="avatar-container" v-if="message.sender === 'me'">
          <div class="avatar sent-avatar">
            {{ chatStore.currentUser ? (chatStore.currentUser.nickname || chatStore.currentUser.username)?.charAt(0).toUpperCase() : 'M' }}
          </div>
        </div>
        <span v-if="message.error && message.sender === 'me'" class="error-indicator" title="消息发送失败">!</span>
      </div>
      <div class="message-footer" v-if="message.sender === 'me' && message.error">
        <span class="error-status">发送失败</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUpdated } from 'vue'
import { useChatStore } from '../../store/chatStore'
import '../../assets/message-list.css'

interface Message {
  id: string
  text: string
  sender: 'me' | 'other'
  userId: string
  timestamp: Date
  error?: boolean
  errorMessage?: string
}

const props = defineProps<{ messages: Message[] }>()
const chatStore = useChatStore()

// 获取用户昵称的首字母
const getUserInitial = (userId: string) => {
  const user = chatStore.users.find(u => u.id === userId)
  if (user) {
    return (user.nickname || user.username)?.charAt(0).toUpperCase() || 'U'
  }
  return 'U'
}

const messageList = ref<HTMLElement | null>(null)

// 格式化时间显示
const formatTime = (timestamp: Date) => {
  const now = new Date()
  const date = new Date(timestamp)
  
  // 如果是今天，只显示时间
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  // 如果是昨天，显示"昨天"
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }
  
  // 其他情况显示完整日期
  return date.toLocaleString('zh-CN')
}

// 当消息列表更新时，自动滚动到底部
onUpdated(() => {
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight
  }
})

// 也可以使用watch监听props的变化
watch(() => props.messages, () => {
  // 使用setTimeout确保DOM更新完成后再滚动
  setTimeout(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  }, 0)
}, { deep: true })
</script>
