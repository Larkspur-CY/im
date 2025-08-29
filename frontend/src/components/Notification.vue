<template>
  <div v-if="message" :class="['notification', type]">
    {{ message }}
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

interface Props {
  message: string
  type: 'success' | 'error'
}

defineProps<Props>()
</script>

<style scoped>
.notification {
  font-size: 14px;
  margin-bottom: 15px;
  text-align: left;
  padding: 8px;
  border-radius: 4px;
  border-left: 3px solid;
}

.success {
  color: #28a745;
  background-color: rgba(40, 167, 69, 0.1);
  border-left-color: #28a745;
}

.error {
  color: #ff4757;
  background-color: rgba(255, 71, 87, 0.1);
  border-left-color: #ff4757;
}
</style>