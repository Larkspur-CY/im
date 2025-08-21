<template>
  <div class="user-list">
    <h3>在线用户</h3>
    <ul>
      <li 
        v-for="user in users" 
        :key="user.id" 
        @click="$emit('select-user', user)"
        :class="{ active: selectedUser?.id === user.id }"
      >
        {{ user.nickname || user.username }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
defineProps<{ users: User[]; selectedUser: User | null }>()
defineEmits(['select-user'])

interface User {
  id: string
  username: string
  nickname?: string
}
</script>

<style scoped>
.user-list {
  width: 250px;
  border-right: 1px solid #e0e0e0;
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.user-list h3 {
  margin-top: 0;
}

.user-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.user-list li {
  padding: 10px;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 5px;
}

.user-list li:hover {
  background-color: #f0f0f0;
}

.user-list li.active {
  background-color: #0084ff;
  color: white;
}
</style>