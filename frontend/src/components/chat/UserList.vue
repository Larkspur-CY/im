<template>
  <div class="user-list">
    <div class="user-list-header">
      <h3>用户列表</h3>
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
          <div class="user-name">
            <span class="name-text">{{ user.nickname || user.username }}</span>
            <span
              v-if="user.unreadCount && user.unreadCount > 0"
              class="unread-count"
            >
              {{ user.unreadCount }}
            </span>
          </div>
          <div class="user-status">
            <span
              class="status-indicator"
              :class="{ online: user.isOnline, offline: !user.isOnline }"
            ></span>
            <span class="status-text">{{
              user.isOnline ? "在线" : "离线"
            }}</span>
          </div>
        </div>
      </li>
    </ul>

    <!-- 底部图标按钮 -->
    <div class="footer-buttons">
      <button class="icon-button" @click="openUserSettings" title="用户设置">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>
      <button
        class="icon-button"
        @click="openSecuritySettings"
        title="安全设置"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"
          />
        </svg>
      </button>
      <button
        class="icon-button logout-icon"
        @click="handleLogout"
        title="退出登录"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </div>

    <!-- 用户设置弹窗 -->
    <div
      v-if="showUserSettings"
      class="modal-overlay"
      @click="closeUserSettings"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>用户设置</h3>
          <button class="close-button" @click="closeUserSettings">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>用户名:</label>
            <input v-model="currentUser.username" disabled />
          </div>
          <div class="form-group">
            <label>昵称:</label>
            <input v-model="currentUser.nickname" required />
          </div>
          <div class="form-group">
            <label>允许好友查看消息已读状态:</label>
            <div class="radio-options">
              <div class="radio-option">
                <input
                  type="radio"
                  id="showReadStatusYes"
                  :value="1"
                  v-model="currentUser.showReadStatus"
                />
                <label for="showReadStatusYes">是</label>
              </div>
              <div class="radio-option">
                <input
                  type="radio"
                  id="showReadStatusNo"
                  :value="0"
                  v-model="currentUser.showReadStatus"
                />
                <label for="showReadStatusNo">否</label>
              </div>
            </div>
          </div>
          <div class="form-actions">
            <button class="save-button" @click="saveUserSettings">保存</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 安全设置弹窗 -->
    <div
      v-if="showSecuritySettings"
      class="modal-overlay"
      @click="closeSecuritySettings"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>安全设置</h3>
          <button class="close-button" @click="closeSecuritySettings">
            &times;
          </button>
        </div>
        <div class="modal-body">
            <!-- 第一步：验证当前密码 -->
            <div v-if="securityStep === 1">
              <div class="form-group">
                <label>当前密码:</label>
                <input
                  type="password"
                  v-model="securitySettings.oldPassword"
                  placeholder="请输入当前密码"
                />
              </div>
            </div>

            <!-- 第二步：修改邮箱和新密码 -->
            <div v-if="securityStep === 2">
              <div class="form-group">
                <label>邮箱:</label>
                <input
                  type="email"
                  v-model="securitySettings.email"
                  placeholder="请输入新邮箱"
                />
              </div>
              <div class="form-group">
                <label>新密码:</label>
                <input
                  type="password"
                  v-model="securitySettings.newPassword"
                  placeholder="请输入新密码"
                />
              </div>
              <div class="form-group">
                <label>确认新密码:</label>
                <input
                  type="password"
                  v-model="securitySettings.confirmPassword"
                  placeholder="请再次输入新密码"
                />
              </div>
            </div>

            <div class="form-actions">
              <button
                v-if="securityStep === 1"
                class="save-button"
                @click="verifyCurrentPassword"
              >
                下一步
              </button>
              <div v-if="securityStep === 2">
                <button class="save-button" @click="saveSecuritySettings">
                  保存
                </button>
              </div>
            </div>
          </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { authService } from "../../services/authService";
import { userApi } from "../../services/apiService";
import "../../assets/user-list.css";

defineProps<{ users: User[]; selectedUser: User | null }>();
const emit = defineEmits(["select-user"]);

interface User {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
  status?: "online" | "offline" | "away";
  isOnline?: boolean;
  unreadCount?: number;
  showReadStatus?: boolean;
}

// 弹窗状态
const showUserSettings = ref(false);
const showSecuritySettings = ref(false);

// 当前用户信息
const currentUser = ref({
  id: 0,
  username: "",
  nickname: "",
  showReadStatus: 1,
});

// 安全设置步骤状态
const securityStep = ref(1);

// 安全设置信息
const securitySettings = ref({
  email: "",
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const router = useRouter();

// 获取当前用户信息
const loadCurrentUser = () => {
  const user = authService.getCurrentUser();
  if (user) {
    currentUser.value = {
      id: user.id,
      username: user.username,
      nickname: user.nickname || "",
      showReadStatus:
        user.showReadStatus !== undefined ? (user.showReadStatus ? 1 : 0) : 1,
    };
  }
};

onMounted(() => {
  loadCurrentUser();
});

const handleLogout = async () => {
  try {
    // 调用认证服务的登出方法（现在是异步的）
    await authService.logout();
    
    // 跳转到登录页面
    router.push("/login");
  } catch (error) {
    console.error("登出失败:", error);
    // 即使失败也尝试跳转到登录页面
    router.push("/login");
  }
};

// 打开用户设置弹窗
const openUserSettings = () => {
  loadCurrentUser();
  showUserSettings.value = true;
};

// 关闭用户设置弹窗
const closeUserSettings = () => {
  showUserSettings.value = false;
};

// 打开安全设置弹窗
const openSecuritySettings = () => {
  const user = authService.getCurrentUser();
  securitySettings.value = {
    email: user?.email || "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
  securityStep.value = 1; // 重置步骤
  showSecuritySettings.value = true;
};

// 关闭安全设置弹窗
const closeSecuritySettings = () => {
  showSecuritySettings.value = false;
};

// 保存用户设置
const saveUserSettings = async () => {
  // 验证昵称输入
  if (!currentUser.value.nickname) {
    alert("请输入昵称");
    return;
  }

  try {
    await userApi.updateUser({
      nickname: currentUser.value.nickname,
      showReadStatus: currentUser.value.showReadStatus === 1,
    });

    // 更新本地存储的用户信息
    const user = authService.getCurrentUser();
    if (user) {
      user.nickname = currentUser.value.nickname;
      user.showReadStatus = currentUser.value.showReadStatus === 1;
      localStorage.setItem("user", JSON.stringify(user));
    }

    closeUserSettings();
    alert("用户设置保存成功");
  } catch (error) {
    console.error("保存用户设置失败:", error);
    alert("保存用户设置失败: " + (error as any).response?.data || "未知错误");
  }
};

// 验证当前密码
const verifyCurrentPassword = async () => {
  if (!securitySettings.value.oldPassword) {
    alert("请输入当前密码");
    return;
  }

  try {
    // 调用验证密码接口
    await userApi.verifyPassword({
      password: securitySettings.value.oldPassword
    });
    
    // 验证成功，进入第二步
    securityStep.value = 2;
  } catch (error) {
    console.error("密码验证失败:", error);
    alert("当前密码错误，请重新输入");
  }
};

// 保存安全设置
const saveSecuritySettings = async () => {
  // 验证邮箱输入
  if (securitySettings.value.email) {
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(securitySettings.value.email)) {
      alert("请输入有效的邮箱地址");
      return;
    }
  }

  // 验证密码输入
  if (securitySettings.value.newPassword || securitySettings.value.confirmPassword) {
    if (!securitySettings.value.newPassword) {
      alert("请输入新密码");
      return;
    }

    if (!securitySettings.value.confirmPassword) {
      alert("请确认新密码");
      return;
    }

    if (securitySettings.value.newPassword !== securitySettings.value.confirmPassword) {
      alert("两次输入的密码不一致");
      return;
    }
  }

  try {
    // 如果有邮箱或密码修改，才调用API
    if (securitySettings.value.email || securitySettings.value.newPassword) {
      await userApi.changePassword({
        oldPassword: securitySettings.value.oldPassword,
        newPassword: securitySettings.value.newPassword ,
        email: securitySettings.value.email ,
      });

      // 更新本地存储的用户信息
      const user = authService.getCurrentUser();
      if (user) {
        if (securitySettings.value.email) {
          user.email = securitySettings.value.email;
        }
        localStorage.setItem("user", JSON.stringify(user));
      }

      closeSecuritySettings();
      alert("修改成功");
    } else {
      // 没有修改任何内容
      closeSecuritySettings();
      alert("没有修改任何内容");
    }
  } catch (error) {
    console.error("修改失败:", error);
    alert("修改失败: " + (error as any).response?.data || "未知错误");
  }
};
</script>
