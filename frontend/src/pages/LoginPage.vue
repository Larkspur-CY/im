<template>
  <div class="login-container" :class="{ 'qixi-theme': isQixi }">
    <canvas id="particles-canvas" class="particles-canvas"></canvas>
    
    <!-- 七夕节装饰元素 -->
    <div v-if="isQixi" class="qixi-decorations">
      <div class="qixi-heart qixi-heart-1">💕</div>
      <div class="qixi-heart qixi-heart-2">💖</div>
      <div class="qixi-heart qixi-heart-3">💝</div>
      <div class="qixi-star qixi-star-1">⭐</div>
      <div class="qixi-star qixi-star-2">✨</div>
    </div>
    
    <div class="login-box" :class="{ 'qixi-theme': isQixi }">
      <div class="login-header">
        <img src="/images/favicon/android-chrome-192x192.png" alt="Logo" class="login-logo" />
        <h2>Corey IM</h2>
        <p v-if="!isQixi">请登录您的账号</p>
        <p v-else class="qixi-greeting">七夕快乐！愿天下有情人终成眷属 💕</p>
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

        <Notification 
          v-if="errorMessage" 
          :message="errorMessage" 
          type="error" 
        />

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

        <button class="login-button" :class="{ 'qixi-theme': isQixi }" @click="login" :disabled="isLoading">
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

        <Notification 
          v-if="resetErrorMessage" 
          :message="resetErrorMessage" 
          type="error" 
        />
        <Notification 
          v-if="resetSuccessMessage" 
          :message="resetSuccessMessage" 
          type="success" 
        />

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
import { openApi } from "../services/apiService";
import { initParticles, updateParticleTheme } from "../assets/particles";
import { initQixiParticles, updateQixiParticleTheme } from "../assets/qixi-particles";
import { Lunar } from 'lunar-typescript';
import "../assets/login.css";
import Notification from "../components/Notification.vue";
import { debounce } from '../utils/debounceUtil'

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

// 七夕节检测
const isQixi = ref(false);

const login = debounce(async () => {
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
});

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
const handleResetPassword = debounce(async () => {
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
      const response = await openApi.verifyUserEmail({
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
      await openApi.resetPassword({
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
});

// 检查是否有记住的用户名
const rememberedUsername = localStorage.getItem("rememberedUsername");
if (rememberedUsername) {
  username.value = rememberedUsername;
  rememberMe.value = true;
}

// 初始化粒子背景
onMounted(() => {
  // 检测当前主题
  const currentTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | null;
  
  // 检查是否是七夕节
  const today = new Date();
  const lunar = Lunar.fromDate(today);
  
  // 七夕节是农历七月初七
  isQixi.value = (lunar.getMonth() === 7 && lunar.getDay() === 7);
  
  if (isQixi.value) {
    // 七夕节使用专属特效
    initQixiParticles("particles-canvas", 120, currentTheme === 'dark' ? 'dark' : 'light');
  } else {
    // 普通日子使用常规粒子特效
    initParticles("particles-canvas", 80, currentTheme === 'dark' ? 'dark' : 'light');
  }

  // 监听主题变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        const newTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | null;
        // 更新粒子主题而不是重新初始化
        if (isQixi.value) {
          updateQixiParticleTheme(newTheme === 'dark' ? 'dark' : 'light');
        } else {
          updateParticleTheme(newTheme === 'dark' ? 'dark' : 'light');
        }
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
});

// 组件卸载时清理事件监听器
onUnmounted(() => {
  const observer = (window as any).themeObserver;
  if (observer) {
    observer.disconnect();
    delete (window as any).themeObserver;
  }
});
</script>
