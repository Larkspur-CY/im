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

defineProps<{ selectedUser: User | null }>()
const emit = defineEmits(['send-message'])

interface User {
  id: string
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

<style scoped>
.message-input {
  display: flex;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  background-color: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.message-input input {
  flex: 1;
  padding: 12px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 30px;
  outline: none;
  font-size: 14px;
  transition: border-color 0.3s, box-shadow 0.3s;
  background-color: #fff;
  color: #333;
}

.message-input input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.message-input input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.message-input button {
  margin-left: 10px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  min-width: 80px;
}

.message-input button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.message-input button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .message-input {
    border-top: 1px solid #3a3a3a;
    background-color: #252525;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  }
  
  .message-input input {
    border: 2px solid #3a3a3a;
    background-color: #1e1e1e;
    color: #e0e0e0;
  }
  
  .message-input input:focus {
    border-color: #764ba2;
    box-shadow: 0 0 0 3px rgba(118, 75, 162, 0.3);
  }
  
  .message-input input:disabled {
    background-color: #2d2d2d;
  }
  
  .message-input button {
    box-shadow: 0 4px 12px rgba(118, 75, 162, 0.4);
  }
  
  .message-input button:hover:not(:disabled) {
    box-shadow: 0 6px 16px rgba(118, 75, 162, 0.5);
  }
}
</style>