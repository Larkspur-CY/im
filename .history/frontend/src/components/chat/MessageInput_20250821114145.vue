<template>
  <div class="message-input">
    <input 
      v-model="messageText" 
      @keyup.enter="sendMessage" 
      placeholder="输入消息..." 
      :disabled="!selectedUser"
    />
    <button @click="sendMessage" :disabled="!selectedUser">发送</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ selectedUser: User | null }>()
const emit = defineEmits(['send-message'])

interface User {
  id: string
  name: string
}

const messageText = ref('')

const sendMessage = () => {
  if (messageText.value.trim() && this.selectedUser) {
    emit('send-message', messageText.value)
    messageText.value = ''
  }
}
</script>

<style scoped>
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

.message-input button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>