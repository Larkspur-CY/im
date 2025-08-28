# IM聊天系统后端开发文档

## 目录
1. [项目概述](#项目概述)
2. [开发环境搭建](#开发环境搭建)
3. [项目结构说明](#项目结构说明)
4. [数据库设计](#数据库设计)
5. [API接口文档](#api接口文档)
6. [WebSocket通讯协议](#websocket通讯协议)
7. [安全认证机制](#安全认证机制)
8. [测试指南](#测试指南)
9. [部署说明](#部署说明)

## 项目概述

IM聊天系统后端是基于Spring Boot的实时通讯服务，提供用户管理、消息处理和WebSocket实时通讯功能。

### 核心功能
- 用户注册、登录和信息管理
- 实时消息发送和接收
- 消息历史记录和状态管理
- 在线用户状态跟踪
- WebSocket双向通讯

## 开发环境搭建

### 所需软件
- JDK 8或更高版本
- Maven 3.6或更高版本
- MySQL 8.0或更高版本
- IntelliJ IDEA或其它Java IDE

### 配置步骤

1. 克隆项目代码
2. 导入项目到IDE中
3. 创建MySQL数据库：
```sql
CREATE DATABASE im_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
4. 修改`src/main/resources/application.yml`中的数据库连接配置
5. 运行`mvn clean compile`编译项目
6. 运行`ImBackendApplication`启动项目

## 项目结构说明

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/im/backend/
│   │   │   ├── ImBackendApplication.java          # 主启动类
│   │   │   ├── config/                            # 配置类
│   │   │   │   ├── WebSocketConfig.java           # WebSocket配置
│   │   │   │   └── SecurityConfig.java            # 安全配置
│   │   │   ├── controller/                        # 控制器
│   │   │   │   ├── UserController.java            # 用户管理
│   │   │   │   ├── MessageController.java         # 消息管理
│   │   │   │   └── ChatController.java            # WebSocket聊天
│   │   │   ├── service/                           # 业务逻辑
│   │   │   │   ├── UserService.java               # 用户服务
│   │   │   │   └── MessageService.java            # 消息服务
│   │   │   ├── repository/                        # 数据访问
│   │   │   │   ├── UserRepository.java            # 用户仓库
│   │   │   │   └── MessageRepository.java         # 消息仓库
│   │   │   └── model/                             # 实体类
│   │   │       ├── User.java                      # 用户实体
│   │   │       └── Message.java                   # 消息实体
│   │   └── resources/
│   │       ├── application.yml                    # 应用配置
│   │       └── schema.sql                         # 数据库初始化
│   └── test/
└── pom.xml                                        # Maven配置
```

## 数据库设计

### 用户表 (user)
| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | BIGINT | 用户ID |
| username | VARCHAR(50) | 用户名 |
| password | VARCHAR(100) | 密码（BCrypt加密） |
| email | VARCHAR(100) | 邮箱 |
| nickname | VARCHAR(50) | 昵称 |
| avatar | VARCHAR(255) | 头像URL |
| status | INT | 在线状态 (0:离线, 1:在线) |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 消息表 (message)
| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | BIGINT | 消息ID |
| sender_id | BIGINT | 发送者ID |
| receiver_id | BIGINT | 接收者ID |
| content | TEXT | 消息内容 |
| type | VARCHAR(20) | 消息类型 (TEXT, IMAGE, FILE) |
| status | INT | 消息状态 (0:未读, 1:已读) |
| created_at | TIMESTAMP | 创建时间 |

## API接口文档

### 用户相关接口

#### 注册
- **URL**: `POST /api/users/register`
- **参数**:
  ```json
  {
    "username": "string",
    "password": "string",
    "email": "string",
    "nickname": "string"
  }
  ```
- **响应**:
  ```json
  {
    "id": 1,
    "username": "string",
    "email": "string",
    "nickname": "string",
    "avatar": "string"
  }
  ```

#### 登录
- **URL**: `POST /api/users/login`
- **参数**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **响应**:
  ```json
  {
    "token": "string",
    "user": {
      "id": 1,
      "username": "string",
      "email": "string",
      "nickname": "string",
      "avatar": "string"
    }
  }
  ```

#### 获取所有用户
- **URL**: `GET /api/users`
- **响应**:
  ```json
  [
    {
      "id": 1,
      "username": "string",
      "email": "string",
      "nickname": "string",
      "avatar": "string",
      "status": 1
    }
  ]
  ```

### 消息相关接口

#### 发送消息
- **URL**: `POST /api/messages`
- **参数**:
  ```json
  {
    "senderId": 1,
    "receiverId": 2,
    "content": "string",
    "type": "TEXT"
  }
  ```
- **响应**:
  ```json
  {
    "id": 1,
    "senderId": 1,
    "receiverId": 2,
    "content": "string",
    "type": "TEXT",
    "status": 0,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
  ```

#### 获取两用户间消息
- **URL**: `GET /api/messages/between/{senderId}/{receiverId}`
- **响应**:
  ```json
  [
    {
      "id": 1,
      "senderId": 1,
      "receiverId": 2,
      "content": "string",
      "type": "TEXT",
      "status": 0,
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
  ```

## WebSocket通讯协议

### 连接地址
```
ws://localhost:8080/ws
```

### 消息格式
```json
{
  "senderId": 1,
  "receiverId": 2,
  "content": "Hello World",
  "type": "TEXT"
}
```

### 在线状态通知
当用户上线或下线时，系统会向所有在线用户广播通知：
```json
{
  "type": "USER_STATUS",
  "userId": 1,
  "status": 1 // 1:在线, 0:离线
}
```

## 安全认证机制

系统使用JWT (JSON Web Token) 进行用户身份认证。

### 认证流程
1. 用户通过`/api/users/login`接口登录
2. 服务器验证用户凭据，生成JWT令牌
3. 客户端在后续请求的Authorization头中携带令牌：
```
Authorization: Bearer <token>
```
4. 服务器验证令牌有效性

### 令牌结构
- **Header**: 包含令牌类型和加密算法
- **Payload**: 包含用户ID和过期时间等信息
- **Signature**: 用于验证令牌完整性

## 测试指南

### 单元测试
使用JUnit 5和Mockito进行单元测试：
```bash
mvn test
```

### API测试
可以使用curl或Postman测试API接口：

#### 用户注册
```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "123456",
    "email": "test@example.com",
    "nickname": "测试用户"
  }'
```

#### 用户登录
```bash
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "123456"
  }'
```

## 部署说明

### 打包应用
```bash
mvn clean package
```

### 运行应用
```bash
java -jar target/im-backend-0.0.1-SNAPSHOT.jar
```

### Docker部署（可选）
创建Dockerfile：
```dockerfile
FROM openjdk:8-jdk-alpine
VOLUME /tmp
COPY target/im-backend-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/app.jar"]
```

构建和运行Docker镜像：
```bash
docker build -t im-backend .
docker run -p 8080:8080 im-backend
```