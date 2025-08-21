# IM聊天系统 - 前端项目

一个基于Vue 3、TypeScript和Vite的现代化Web聊天应用。

## 技术栈

- Vue 3
- Vue Router
- Pinia (状态管理)
- Element Plus (UI组件库)
- WebSocket (实时通讯)
- TypeScript
- Vite

## 依赖检查

所有必需的依赖项都已正确添加到package.json中：

### 运行时依赖 (dependencies)
- vue (^3.5.18)
- vue-router (^4.5.1)
- pinia (^3.0.3)
- axios (^1.11.0)
- sockjs-client (^1.6.1)

### 开发依赖 (devDependencies)
- @types/sockjs-client (^1.5.4)
- @vitejs/plugin-vue (^6.0.1)
- @vue/tsconfig (^0.7.0)
- typescript (~5.8.3)
- vite (^7.1.2)
- vue-tsc (^3.0.5)

## 快速开始

```bash
cd frontend
npm install
npm run dev
```

## 端口配置

- 前端服务: http://localhost:3000
- WebSocket: ws://localhost:8080/ws

## 项目结构

```
frontend/
├── src/
│   ├── components/     # Vue组件
│   ├── pages/          # 页面组件
│   ├── services/       # 服务层（API和WebSocket）
│   ├── store/          # 状态管理（Pinia）
│   ├── router/         # 路由配置
│   ├── assets/         # 静态资源
│   └── App.vue         # 根组件
├── public/             # 静态文件
└── package.json        # 项目配置和依赖
```

## 功能特性

- 实时消息发送/接收
- 用户状态管理
- 好友列表展示
- 消息历史记录
- 在线状态显示
