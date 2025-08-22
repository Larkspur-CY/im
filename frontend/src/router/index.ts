import { createRouter, createWebHistory } from 'vue-router'
import ChatPage from '../pages/ChatPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import RegisterPage from '../pages/RegisterPage.vue'
import { authService } from '../services/authService'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  { 
    path: '/chat', 
    component: ChatPage,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫，检查用户是否已登录
router.beforeEach((to, from, next) => {
  const isAuthenticated = authService.isAuthenticated()
  
  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    // 需要登录但用户未登录，重定向到登录页
    next({ path: '/login' })
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    // 用户已登录但尝试访问登录或注册页，重定向到聊天页
    next({ path: '/chat' })
  } else {
    // 其他情况正常导航
    next()
  }
})

export default router
