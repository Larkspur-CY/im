-- 创建数据库
CREATE DATABASE IF NOT EXISTS im_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE im_chat;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    nickname VARCHAR(100),
    avatar VARCHAR(500),
    is_online BOOLEAN DEFAULT FALSE,
    last_login_time DATETIME,
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建消息表
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content TEXT,
    type ENUM('TEXT', 'IMAGE', 'FILE', 'VOICE', 'VIDEO') DEFAULT 'TEXT',
    is_read BOOLEAN DEFAULT FALSE,
    sent_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sender_receiver (sender_id, receiver_id),
    INDEX idx_receiver_unread (receiver_id, is_read),
    INDEX idx_sent_time (sent_time)
);

-- 插入测试数据
INSERT INTO users (username, password, email, nickname, avatar) VALUES 
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVajVe', 'admin@example.com', '管理员', 'https://via.placeholder.com/50'),
('user1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVajVe', 'user1@example.com', '用户1', 'https://via.placeholder.com/50'),
('user2', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVajVe', 'user2@example.com', '用户2', 'https://via.placeholder.com/50');
