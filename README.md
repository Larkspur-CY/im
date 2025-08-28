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
- TypeScript
- Vite

### 后端
- Spring Boot 2.7+
- Spring WebSocket
- Spring Security
- Spring Data JPA
- MySQL 8.0.33 (数据库)
- MyBatis Plus
- JWT (身份认证)
- Lombok

## 功能特性

- 用户注册/登录
- 实时消息发送/接收
- 好友管理
- 群聊功能
- 消息历史记录
- 在线状态显示
- 消息提醒
- 未读消息统计
- 消息已读状态
- 支持文本、图片、文件等消息类型

## 快速开始

### 环境要求

#### 后端
- JDK 8+
- Maven 3.6+
- MySQL 8.0+

#### 前端
- Node.js 14+
- npm 6+

### 后端启动

1. 创建MySQL数据库：
```sql
CREATE DATABASE im_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 修改`backend/src/main/resources/application.yml`中的数据库连接配置

3. 编译和运行后端项目：
```bash
cd backend
mvn clean compile
mvn spring-boot:run
```

### 前端启动

1. 安装依赖：
```bash
cd frontend
npm install
```

2. 运行前端开发服务器：
```bash
npm run dev
```

### 默认测试账号
- 用户名: admin, 密码: admin
- 用户名: user1, 密码: user1  
- 用户名: user2, 密码: user2

## 端口配置

- 后端服务: http://localhost:8080
- 前端服务: http://localhost:5173
- WebSocket: ws://localhost:8080/ws

## 项目文档

- [后端详细文档](backend/README.md)
- [前端详细文档](frontend/README.md)