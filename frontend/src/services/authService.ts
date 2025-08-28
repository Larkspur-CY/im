import { userApi, openApi } from './apiService'
import { websocketService } from './websocketService'
import { jwtDecode } from 'jwt-decode'

// 定义用户类型
export interface User {
  id: number
  username: string
  nickname?: string
  email: string
  avatar?: string
  isOnline?: boolean
  lastLoginTime?: string
  createdTime?: string
  updatedTime?: string
  showReadStatus?: boolean
}

// 定义登录凭证类型
export interface LoginCredentials {
  username: string
  password: string
}

// 定义注册数据类型
export interface RegisterData {
  username: string
  nickname: string
  email: string
  password: string
}

// 定义认证服务
export const authService = {
  // 登录
  login: async (credentials: LoginCredentials): Promise<User> => {
    try {
      const response = await openApi.login(credentials)
      
      // 保存用户信息到本地存储
      localStorage.setItem('user', JSON.stringify(response.data.user))
      
      // 保存JWT token
      localStorage.setItem('token', response.data.token)
      
      return response.data.user
    } catch (error: any) {
      console.error('登录失败:', error)
      throw error
    }
  },
  
  // 注册
  register: async (data: RegisterData): Promise<User> => {
    try {
      const response = await openApi.register(data)
      return response.data
    } catch (error: any) {
      console.error('注册失败:', error)
      throw error
    }
  },
  
  // 登出
  logout: async (): Promise<void> => {
    try {
      // 获取当前用户ID
      const currentUser = authService.getCurrentUser()
      
      // 如果用户已登录，先通知后端用户下线
      if (currentUser && currentUser.id) {
        try {
          // 尝试通知后端用户下线
          await userApi.setUserOffline(currentUser.id)
        } catch (error) {
          console.error('通知后端用户下线失败:', error)
          // 即使通知失败也继续登出流程
        }
      }
      
      // 断开WebSocket连接
      websocketService.disconnect()
      
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } catch (error) {
      console.error('登出过程中发生错误:', error)
      // 确保即使出错也清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },
  
  // 获取当前用户
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },
  
  // 检查是否已登录
  isAuthenticated: (): boolean => {
    return localStorage.getItem('token') !== null
  },
  
  // 验证用户是否有效
  validateUser: async (): Promise<boolean> => {
    const token = localStorage.getItem('token')
    if (!token) return false
    
    try {
      // 解析JWT token获取用户ID
      const decoded: any = jwtDecode(token)
      const userId = decoded.sub
      
      const response = await userApi.getUserById(userId)
      return response.status === 200
    } catch (error: any) {
      console.error('用户验证失败:', error)
      authService.logout() // 如果用户无效，清除本地存储
      return false
    }
  }
}

export default authService