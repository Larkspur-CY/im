import { createApp } from 'vue'
import './style.css'
import './assets/chat.css'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

// 引入API服务
import './services/apiService'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
