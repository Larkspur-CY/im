<template>
  <div class="login-container">
    <canvas id="particles-canvas" class="particles-canvas"></canvas>
    <div class="login-box">
      <div class="login-header">
        <img src="/images/favicon/android-chrome-192x192.png" alt="Logo" class="login-logo" />
        <h2>Corey IM</h2>
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
          <a
            href="#"
            class="forgot-password"
            @click.prevent="showForgotPasswordModal = true"
            >忘记密码?</a
          >
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

  <!-- 忘记密码模态框 -->
  <div v-if="showForgotPasswordModal" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3>重置密码</h3>
        <button class="close-button" @click="closeResetPasswordModal">
          &times;
        </button>
      </div>
      <div class="modal-body">
        <div v-if="resetStep === 1">
          <div class="form-group modal-form-group">
            <label for="reset-username">用户名</label>
            <input
              type="text"
              id="reset-username"
              v-model="resetUsername"
              placeholder="请输入您的用户名"
            />
          </div>
          <div class="form-group modal-form-group">
            <label for="reset-email">邮箱</label>
            <input
              type="email"
              id="reset-email"
              v-model="resetEmail"
              placeholder="请输入您的注册邮箱"
            />
          </div>
        </div>

        <div v-if="resetStep === 2">
          <div class="form-group modal-form-group">
            <label for="new-password">新密码</label>
            <input
              type="password"
              id="new-password"
              v-model="newPassword"
              placeholder="请输入新密码"
            />
          </div>
          <div class="form-group modal-form-group">
            <label for="confirm-password">确认密码</label>
            <input
              type="password"
              id="confirm-password"
              v-model="confirmPassword"
              placeholder="请再次输入新密码"
            />
          </div>
        </div>

        <div v-if="resetErrorMessage" class="error-message">
          {{ resetErrorMessage }}
        </div>
        <div v-if="resetSuccessMessage" class="success-message">
          {{ resetSuccessMessage }}
        </div>

        <div class="modal-footer">
          <button
            class="reset-button"
            @click="handleResetPassword"
            :disabled="resetLoading"
          >
            {{
              resetLoading
                ? "处理中..."
                : resetStep === 1
                ? "下一步"
                : "重置密码"
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { authService } from "../services/authService";
import { userApi } from "../services/apiService";
import { initParticles } from "../assets/particles";
import "../assets/login.css";

const router = useRouter();

const username = ref("");
const password = ref("");
const rememberMe = ref(false);
const isLoading = ref(false);
const errorMessage = ref("");

// 忘记密码相关状态
const showForgotPasswordModal = ref(false);
const resetStep = ref(1);
const resetUsername = ref("");
const resetEmail = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const resetLoading = ref(false);
const resetErrorMessage = ref("");
const resetSuccessMessage = ref("");

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

// 关闭重置密码弹窗并重置所有状态
const closeResetPasswordModal = () => {
  showForgotPasswordModal.value = false;
  resetStep.value = 1;
  resetUsername.value = "";
  resetEmail.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  resetErrorMessage.value = "";
  resetSuccessMessage.value = "";
};

// 忘记密码处理函数
const handleResetPassword = async () => {
  resetErrorMessage.value = "";
  resetSuccessMessage.value = "";
  resetLoading.value = true;

  try {
    if (resetStep.value === 1) {
      // 第一步：验证用户名和邮箱
      if (!resetUsername.value || !resetEmail.value) {
        resetErrorMessage.value = "请输入用户名和邮箱";
        return;
      }

      // 调用验证接口
      const response = await userApi.verifyUserEmail({
        username: resetUsername.value,
        email: resetEmail.value,
      });

      if (response.data) {
        resetStep.value = 2;
      }
    } else {
      // 第二步：重置密码
      if (!newPassword.value || !confirmPassword.value) {
        resetErrorMessage.value = "请输入新密码和确认密码";
        return;
      }

      if (newPassword.value !== confirmPassword.value) {
        resetErrorMessage.value = "两次输入的密码不一致";
        return;
      }

      // 调用重置密码接口
      await userApi.resetPassword({
        username: resetUsername.value,
        email: resetEmail.value,
        newPassword: newPassword.value,
      });

      resetSuccessMessage.value = "密码重置成功，请使用新密码登录";

      // 3秒后关闭模态框
      setTimeout(() => {
        closeResetPasswordModal();
      }, 3000);
    }
  } catch (error: any) {
    console.error("重置密码出错:", error);
    if (error.response && error.response.data) {
      resetErrorMessage.value =
        error.response.data.message || "操作失败，请稍后再试";
    } else {
      resetErrorMessage.value = "操作失败，请稍后再试";
    }
  } finally {
    resetLoading.value = false;
  }
};

// 检查是否有记住的用户名
const rememberedUsername = localStorage.getItem("rememberedUsername");
if (rememberedUsername) {
  username.value = rememberedUsername;
  rememberMe.value = true;
}

// 用于存储事件监听器引用
let darkModeMediaQuery: MediaQueryList;
let handleDarkModeChange: (e: MediaQueryListEvent) => void;

// 初始化粒子背景
onMounted(() => {
  // 检测是否为深色模式
  const prefersDarkMode =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const colorScheme = prefersDarkMode ? "dark" : "light";

  // 初始化粒子动画
  initParticles("particles-canvas", 80, colorScheme);

  // 监听深色模式变化
  darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  handleDarkModeChange = (e: MediaQueryListEvent) => {
    const newColorScheme = e.matches ? "dark" : "light";
    // 重新初始化粒子动画
    initParticles("particles-canvas", 80, newColorScheme);
  };

  darkModeMediaQuery.addEventListener("change", handleDarkModeChange);
});

// 组件卸载时清理事件监听器
onUnmounted(() => {
  if (darkModeMediaQuery && handleDarkModeChange) {
    darkModeMediaQuery.removeEventListener("change", handleDarkModeChange);
  }
});
</script>
