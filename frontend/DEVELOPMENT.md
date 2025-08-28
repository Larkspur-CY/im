# IM聊天系统前端开发文档

## 目录
1. [项目概述](#项目概述)
2. [开发环境搭建](#开发环境搭建)
3. [项目结构说明](#项目结构说明)
4. [组件说明](#组件说明)
5. [路由配置](#路由配置)
6. [状态管理](#状态管理)
7. [API服务](#api服务)
8. [WebSocket通讯](#websocket通讯)
9. [样式架构](#样式架构)
10. [构建和部署](#构建和部署)

## 项目概述

IM聊天系统前端是基于Vue 3、TypeScript和Vite构建的现代化实时聊天应用。

### 核心功能
- 用户注册、登录和身份验证
- 实时消息发送和接收
- 用户列表显示和在线状态跟踪
- 消息历史记录查看
- 未读消息提醒
- 响应式设计和深色模式支持

## 开发环境搭建

### 所需软件
- Node.js 14或更高版本
- npm 6或更高版本
- VS Code（推荐）或其它代码编辑器

### 配置步骤

1. 克隆项目代码
2. 安装依赖：
```bash
npm install
```
3. 启动开发服务器：
```bash
npm run dev
```
4. 在浏览器中访问`http://localhost:5173`

## 项目结构说明

```
src/
├── assets/           # 静态资源和CSS文件
├── components/       # 可复用组件
│   └── chat/        # 聊天相关组件
├── pages/           # 页面组件
├── router/          # 路由配置
├── services/        # API服务和WebSocket
├── store/           # Pinia状态管理
├── utils/           # 工具函数
└── main.ts          # 应用入口
```

## 组件说明

### 页面组件

#### 登录页面 (LoginPage.vue)
- 提供用户登录表单
- 验证用户凭据
- 登录成功后跳转到聊天页面

#### 注册页面 (RegisterPage.vue)
- 提供用户注册表单
- 验证用户输入
- 注册成功后跳转到登录页面

#### 聊天页面 (ChatPage.vue)
- 显示用户列表
- 显示消息列表
- 提供消息输入框
- 处理消息发送和接收

### 聊天相关组件

#### 用户列表 (UserList.vue)
- 显示在线用户列表
- 显示用户在线状态
- 支持选择聊天对象

#### 消息列表 (MessageList.vue)
- 显示聊天消息历史
- 支持滚动到最新消息
- 显示消息发送者和时间

#### 消息输入 (MessageInput.vue)
- 提供消息输入框
- 支持文本消息发送
- 支持快捷键发送消息

## 路由配置

路由配置文件位于`src/router/index.ts`：

```typescript
const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  { path: '/chat', component: ChatPage, meta: { requiresAuth: true } }
]
```

### 路由守卫
- 未登录用户无法访问聊天页面
- 已登录用户无法访问登录和注册页面

## 状态管理

使用Pinia进行状态管理，状态存储在`src/store/chatStore.ts`中：

### 主要状态
- `currentUser`: 当前登录用户信息
- `users`: 在线用户列表
- `messages`: 消息列表
- `selectedUser`: 当前聊天对象
- `unreadCounts`: 未读消息计数

### 主要操作
- `login`: 用户登录
- `logout`: 用户登出
- `setUsers`: 更新用户列表
- `addMessage`: 添加新消息
- `markAsRead`: 标记消息为已读

## API服务

API服务封装在`src/services/apiService.ts`中：

### 用户相关API
- `register`: 用户注册
- `login`: 用户登录
- `getUsers`: 获取用户列表

### 消息相关API
- `sendMessage`: 发送消息
- `getMessagesBetween`: 获取两用户间消息
- `getUnreadMessages`: 获取未读消息
- `markAsRead`: 标记消息为已读

### 请求拦截器
- 自动在请求头中添加JWT令牌
- 处理响应错误

## WebSocket通讯

WebSocket服务封装在`src/services/websocketService.ts`中：

### 连接管理
- 自动连接到后端WebSocket服务
- 处理连接错误和重连

### 消息处理
- 接收实时消息并更新状态
- 发送消息到服务端
- 处理用户在线状态更新

### 事件类型
- `MESSAGE`: 新消息
- `USER_STATUS`: 用户在线状态变更

## 样式架构

项目采用样式分离的架构设计：

### 样式文件结构
```
src/assets/
├── login.css          # 登录页面样式
├── register.css       # 注册页面样式
├── chat.css           # 聊天页面主体样式
├── message-input.css  # 消息输入组件样式
├── message-list.css   # 消息列表组件样式
└── user-list.css      # 用户列表组件样式
```

### 样式使用方式
- 所有Vue组件的样式都提取到独立的CSS文件中
- Vue组件通过`import`引入对应的CSS文件
- 样式文件命名规则：`组件名.css`

### 深色模式支持
- 使用CSS变量实现主题切换
- 通过`ThemeToggle`组件切换主题

## 构建和部署

### 开发模式
```bash
npm run dev
```

### 类型检查
```bash
npm run type-check
```

### 构建生产版本
```bash
npm run build
```

构建后的文件将输出到`dist`目录。

### 预览生产版本
```bash
npm run preview
```

### Docker部署（可选）
创建Dockerfile：
```dockerfile
FROM node:14 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

构建和运行Docker镜像：
```bash
docker build -t im-frontend .
docker run -p 80:80 im-frontend
```