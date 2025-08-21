# IM聊天系统

一个类似淘宝web端的实时聊天IM系统，包含前端和后端两个项目。

## 项目结构

```
im/
├── frontend/          # Vue前端项目
├── backend/           # SpringBoot后端项目
└── README.md          # 项目说明
```

## 技术栈

### 前端
- Vue 3
- Vue Router
- Pinia (状态管理)
- Element Plus (UI组件库)
- WebSocket (实时通讯)

### 后端
- Spring Boot 2.7+
- Spring WebSocket
- MySQL 8.0.33 (数据库)
- MyBatis Plus
- JWT (身份认证)

## 功能特性

- 用户注册/登录
- 实时消息发送/接收
- 好友管理
- 群聊功能
- 消息历史记录
- 在线状态显示
- 消息提醒

## 快速开始

### 后端启动
```bash
cd backend
mvn spring-boot:run
```

### 前端启动
```bash
cd frontend
npm install
npm run dev
```

## 端口配置

- 后端服务: http://localhost:8080
- 前端服务: http://localhost:3000
- WebSocket: ws://localhost:8080/ws