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
        <div class="user-avatar">
          {{ (user.nickname || user.username)?.charAt(0).toUpperCase() }}
        </div>
        <div class="user-info">
          <div class="user-name">{{ user.nickname || user.username }}</div>
          <div class="user-status">
            <span 
              class="status-indicator" 
              :class="{ online: user.isOnline, offline: !user.isOnline }"
            ></span>
            <span class="status-text">{{ user.isOnline ? '在线' : '离线' }}</span>
          </div>
        </div>
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
  status?: 'online' | 'offline' | 'away'
  isOnline?: boolean
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
  padding: 12px;
  cursor: pointer;
  border-radius: 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.user-list li:hover {
  background-color: #f0f0f0;
  transform: translateY(-2px);
}

.user-list li.active {
  background-color: #0084ff;
  color: white;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  margin-right: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.user-status {
  display: flex;
  align-items: center;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.status-indicator.online {
  background-color: #4caf50;
}

.status-indicator.offline {
  background-color: #9e9e9e;
}

.status-text {
  font-size: 12px;
  color: #666;
}
</style>