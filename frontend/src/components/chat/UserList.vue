<template>
  <div class="user-list">
    <div class="user-list-header">
      <h3>用户列表</h3>
      <button class="logout-button" @click="handleLogout">退出登录</button>
    </div>
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
          <div class="user-name">{{ user.nickname || user.username }}
            <span v-if="user.unreadCount && user.unreadCount > 0" class="unread-count">
              {{ user.unreadCount }}
            </span>
          </div>
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
import { useRouter } from 'vue-router'
import { authService } from '../../services/authService'
import '../../assets/user-list.css'

defineProps<{ users: User[]; selectedUser: User | null }>()
const emit = defineEmits(['select-user'])

interface User {
  id: string
  username: string
  nickname?: string
  status?: 'online' | 'offline' | 'away'
  isOnline?: boolean
  unreadCount?: number
}

const router = useRouter()

const handleLogout = () => {
  // 调用认证服务的登出方法
  authService.logout()
  
  // 跳转到登录页面
  router.push('/login')
}
</script>
