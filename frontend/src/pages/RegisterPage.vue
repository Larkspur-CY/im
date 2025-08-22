<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>创建账号</h2>
        <p>加入即时通讯系统</p>
      </div>
      <div class="login-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="请输入用户名"
          />
        </div>
        
        <div class="form-group">
          <label for="email">电子邮箱</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            placeholder="请输入电子邮箱"
          />
        </div>
        
        <div class="form-group">
          <label for="nickname">昵称</label>
          <input 
            type="text" 
            id="nickname" 
            v-model="nickname" 
            placeholder="请输入昵称"
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="请输入密码"
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="confirmPassword" 
            placeholder="请再次输入密码"
          />
        </div>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <button 
          class="register-button" 
          @click="register" 
          :disabled="isLoading"
        >
          {{ isLoading ? '注册中...' : '注册' }}
        </button>
        
        <div class="login-link">
          已有账号? <a href="#" @click.prevent="goToLogin">登录</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/authService'
import '../assets/login.css'

const router = useRouter()

const username = ref('')
const email = ref('')
const nickname = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const register = async () => {
  // 表单验证
  if (!username.value || !email.value || !nickname.value || !password.value || !confirmPassword.value) {
    errorMessage.value = '请填写所有必填字段'
    return
  }
  
  if (password.value !== confirmPassword.value) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }
  
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    errorMessage.value = '请输入有效的电子邮箱地址'
    return
  }
  
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    await authService.register({
      username: username.value,
      email: email.value,
      nickname: nickname.value,
      password: password.value
    })
    
    alert('注册成功，请登录')
    router.push('/login')
  } catch (error: any) {
    console.error('注册出错:', error)
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message
    } else if (error.response && error.response.status === 400) {
      errorMessage.value = '用户名或邮箱已存在'
    } else {
      errorMessage.value = '注册失败，请稍后再试'
    }
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.error-message {
  color: #ff4757;
  font-size: 14px;
  margin-bottom: 15px;
  text-align: left;
  background-color: rgba(255, 71, 87, 0.1);
  padding: 8px;
  border-radius: 4px;
  border-left: 3px solid #ff4757;
}

.register-button {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.3s;
}

.register-button:hover {
  opacity: 0.9;
}

.register-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>