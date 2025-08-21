import { createRouter, createWebHistory } from 'vue-router'
import ChatPage from '../pages/ChatPage.vue'

const routes = [
  { path: '/', component: ChatPage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router