# IM聊天系统 - 前端

基于Vue 3 + TypeScript + Vite构建的实时聊天系统前端。

## 技术栈

- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全的JavaScript超集
- **Vite** - 快速的前端构建工具
- **Pinia** - Vue状态管理库
- **Vue Router** - Vue官方路由管理器
- **Axios** - HTTP客户端库
- **WebSocket** - 实时通讯

## 项目结构

```
src/
├── assets/           # 静态资源和CSS文件
├── components/       # 可复用组件
│   └── chat/        # 聊天相关组件
├── pages/           # 页面组件
├── router/          # 路由配置
├── services/        # API服务和WebSocket
├── store/           # Pinia状态管理
└── main.ts          # 应用入口
```

## 开发环境配置

### 推荐IDE设置

- [VS Code](https://code.visualstudio.com/) + 以下插件：

#### 必需插件
- **Vue Language Features (Volar)** - Vue 3官方语言支持
- **TypeScript Vue Plugin (Volar)** - Vue中的TypeScript支持

#### CSS类名跳转支持
- **CSS Peek** - 支持从HTML/Vue模板中的CSS类名直接跳转到CSS定义
  - 按住 `Ctrl` 点击类名可跳转到CSS定义
  - 支持跨文件跳转到外部CSS文件
  - 解决样式分离后无法直接跳转的问题

#### 其他推荐插件
- **Auto Rename Tag** - 自动重命名配对的HTML标签
- **Prettier** - 代码格式化
- **ESLint** - 代码质量检查
- **GitLens** - Git增强功能

### 样式架构

项目采用样式分离的架构设计：

#### 样式文件结构
```
src/assets/
├── login.css          # 登录页面样式（包含模态框、表单等）
├── register.css       # 注册页面样式（继承login.css）
├── chat.css          # 聊天页面主体样式
├── message-input.css  # 消息输入组件样式
├── message-list.css   # 消息列表组件样式
└── user-list.css      # 用户列表组件样式
```

#### 样式使用方式
- 所有Vue组件的样式都提取到独立的CSS文件中
- Vue组件通过 `import` 引入对应的CSS文件
- 样式文件命名规则：`组件名.css`

#### 开发体验优化
- 使用CSS Peek插件可以从Vue模板中的类名直接跳转到CSS定义
- 支持跨文件跳转，解决样式分离后的开发体验问题
- 样式集中管理，便于维护和主题切换

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 类型检查
```bash
npm run type-check
```

## 功能特性

- 用户注册/登录
- 实时消息发送/接收
- 用户列表显示
- 消息历史记录
- 在线状态显示
- 未读消息提醒
- 忘记密码功能
- 响应式设计
- 深色模式支持

## 开发注意事项

1. **样式跳转**: 安装CSS Peek插件后可以直接从模板跳转到CSS定义
2. **类型安全**: 项目使用TypeScript，注意类型定义的准确性
3. **状态管理**: 使用Pinia进行状态管理，避免直接修改state
4. **API调用**: 统一使用apiService中定义的方法
5. **WebSocket**: 实时通讯功能通过websocketService管理

## 端口配置

- 前端开发服务器: http://localhost:5173
- 后端API服务: http://localhost:8080
- WebSocket连接: ws://localhost:8080/ws