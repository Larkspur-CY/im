<template>
  <div class="message-list" ref="messageList">
    <div 
      v-for="message in messages" 
      :key="message.id" 
      class="message"
    >
      <div :class="['message-content', message.sender === 'me' ? 'sent' : 'received']">
        {{ message.text }}
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
  timestamp: Date
}

const props = defineProps<{ messages: Message[] }>()

const messageList = ref<HTMLElement | null>(null)

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
  align-self: flex-end;
}

.received {
  background-color: #f0f0f0;
  color: black;
  align-self: flex-start;
}
</style>