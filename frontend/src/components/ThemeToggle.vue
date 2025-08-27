<template>
  <button 
    class="theme-toggle" 
    @click="toggleTheme"
    :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
  >
    <span class="theme-toggle-icon">
      {{ isDark ? '☀️' : '🌙' }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isDark = ref(false)

// 切换主题
const toggleTheme = () => {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  
  // 更新HTML的data-theme属性
  document.documentElement.setAttribute('data-theme', theme)
  
  // 保存到localStorage
  localStorage.setItem('theme', theme)
}

// 初始化主题
onMounted(() => {
  // 从localStorage获取保存的主题，默认为浅色模式
  const savedTheme = localStorage.getItem('theme')
  
  // 如果有保存的主题偏好，使用保存的；否则默认使用浅色模式
  const shouldUseDark = savedTheme === 'dark'
  
  isDark.value = shouldUseDark
  document.documentElement.setAttribute('data-theme', shouldUseDark ? 'dark' : 'light')
  
  // 监听系统主题变化（可选，如果用户没有手动设置过主题）
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      isDark.value = e.matches
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
    }
  })
})
</script>