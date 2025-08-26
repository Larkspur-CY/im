<template>
  <div class="message-input">
    <input 
      v-model="messageText" 
      @keyup.enter="sendMessage" 
      placeholder="输入消息..." 
      :disabled="!selectedUser"
    />
    <button @click="sendMessage" :disabled="!selectedUser">
      <span v-if="!isSending">发送</span>
      <span v-else>发送中...</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import '../../assets/message-input.css'

defineProps<{ selectedUser: User | null }>()
const emit = defineEmits(['send-message'])

interface User {
  id: number
  username: string
  nickname?: string
  email?: string
  avatar?: string
  isOnline?: boolean
}

const messageText = ref('')
const isSending = ref(false)

const sendMessage = () => {
  if (messageText.value.trim() && !isSending.value) {
    isSending.value = true
    emit('send-message', messageText.value)
    // 模拟发送延迟
    setTimeout(() => {
      messageText.value = ''
      isSending.value = false
    }, 300)
  }
}
</script>