<template>
  <div class="message-list" ref="messageList">
    <div 
      v-for="message in messages" 
      :key="message.id" 
      class="message"
      :class="{ 'sent-message': message.sender === 'me', 'received-message': message.sender !== 'me' }"
    >
      <div class="message-header" v-if="message.sender !== 'me'">
        <span class="sender-name">{{ message.senderName || '用户' }}</span>
        <span class="message-time">{{ formatTime(message.timestamp) }}</span>
      </div>
      <div :class="['message-content', message.sender === 'me' ? 'sent' : 'received']">
        {{ message.text }}
      </div>
      <div class="message-footer" v-if="message.sender === 'me'">
        <span class="message-time">{{ formatTime(message.timestamp) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUpdated } from 'vue'

interface Message {
  id: string
  text: string
  sender: 'me' | 'other'
  senderName?: string
  timestamp: Date
}

const props = defineProps<{ messages: Message[] }>()

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

<style scoped>
.message-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.message {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease;
}

.message:hover {
  transform: translateY(-2px);
}

.sent-message {
  align-items: flex-end;
}

.received-message {
  align-items: flex-start;
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  font-size: 12px;
  color: #666;
}

.sender-name {
  font-weight: 500;
  margin-right: 8px;
}

.message-time {
  color: #999;
  font-size: 11px;
}

.message-content {
  display: inline-block;
  padding: 12px 16px;
  border-radius: 18px;
  max-width: 70%;
  word-wrap: break-word;
  position: relative;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.message-content:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.sent {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 8px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.received {
  background-color: #ffffff;
  color: #333;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.message-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
  font-size: 11px;
  color: #999;
}
</style>