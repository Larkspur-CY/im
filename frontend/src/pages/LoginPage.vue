<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>即时通讯系统</h2>
        <p>请登录您的账号</p>
      </div>
      <div class="login-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            type="text"
            id="username"
            v-model="username"
            placeholder="请输入用户名"
            @keyup.enter="login"
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            type="password"
            id="password"
            v-model="password"
            placeholder="请输入密码"
            @keyup.enter="login"
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="form-options">
          <div class="remember-me">
            <input type="checkbox" id="remember" v-model="rememberMe" />
            <label for="remember">记住我</label>
          </div>
          <a href="#" class="forgot-password">忘记密码?</a>
        </div>

        <button class="login-button" @click="login" :disabled="isLoading">
          {{ isLoading ? "登录中..." : "登录" }}
        </button>

        <div class="register-link">
          还没有账号? <a href="#" @click.prevent="goToRegister">注册</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { authService } from "../services/authService";
import "../assets/login.css";

const router = useRouter();

const username = ref("");
const password = ref("");
const rememberMe = ref(false);
const isLoading = ref(false);
const errorMessage = ref("");

const login = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = "请输入用户名和密码";
    return;
  }

  errorMessage.value = "";
  isLoading.value = true;

  try {
    await authService.login({
      username: username.value,
      password: password.value,
    });

    if (rememberMe.value) {
      localStorage.setItem("rememberedUsername", username.value);
    } else {
      localStorage.removeItem("rememberedUsername");
    }

    router.push("/chat");
  } catch (error: any) {
    console.error("登录出错:", error);
    if (error.response && error.response.status === 401) {
      errorMessage.value = "用户名或密码错误";
    } else {
      errorMessage.value = "登录失败，请稍后再试";
    }
  } finally {
    isLoading.value = false;
  }
};

const goToRegister = () => {
  router.push("/register");
};

// 检查是否有记住的用户名
const rememberedUsername = localStorage.getItem("rememberedUsername");
if (rememberedUsername) {
  username.value = rememberedUsername;
  rememberMe.value = true;
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
</style>
