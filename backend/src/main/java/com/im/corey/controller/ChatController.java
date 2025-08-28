package com.im.corey.controller;

import com.im.corey.model.Message;
import com.im.corey.service.UserService;
import com.im.corey.service.MessageService;
import com.im.corey.model.User;

import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.annotation.EnableScheduling;
import com.im.corey.util.WebSocketUtils;

@Controller
@EnableScheduling
public class ChatController {
    // 存储用户最后心跳时间的Map
    private final ConcurrentHashMap<Long, Long> lastHeartbeatTimes = new ConcurrentHashMap<>();

    // 心跳超时时间（毫秒）
    private static final long HEARTBEAT_TIMEOUT = 120000; // 2分钟

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private UserService userService;

    @Autowired
    private MessageService messageService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload Map<String, Object> messagePayload, StompHeaderAccessor headerAccessor) {
        // 从认证信息中获取发送者ID
        Long senderId = WebSocketUtils.extractUserId(headerAccessor);

        // 如果没有有效的senderId
        if (senderId == null) {
            // 记录错误日志
            System.err.println("无法发送消息，因为无法确定发送者ID");
            return;
        }

        try {
            // 创建消息对象并设置属性
            Message message = new Message();
            message.setSenderId(senderId);
            message.setReceiverId(Long.valueOf(messagePayload.get("receiverId").toString()));
            message.setContent((String) messagePayload.get("content"));

            // 如果前端提供了消息ID，保存它用于确认
            Long clientMessageId = null;
            if (messagePayload.get("id") != null) {
                try {
                    clientMessageId = Long.valueOf(messagePayload.get("id").toString());
                } catch (NumberFormatException e) {
                    System.err.println("无效的客户端消息ID格式: " + messagePayload.get("id"));
                }
            }

            // 设置消息类型，如果前端没有提供则默认为TEXT
            String type = (String) messagePayload.get("type");
            if (type != null) {
                try {
                    message.setType(Message.MessageType.valueOf(type));
                } catch (IllegalArgumentException e) {
                    message.setType(Message.MessageType.TEXT);
                }
            } else {
                message.setType(Message.MessageType.TEXT);
            }

            // 保存消息
            message = messageService.saveMessage(message);

            // 创建发送给接收者的消息对象
            Map<String, Object> receiverMessage = new HashMap<>();
            receiverMessage.put("id", message.getId());
            receiverMessage.put("senderId", message.getSenderId());
            receiverMessage.put("receiverId", message.getReceiverId());
            receiverMessage.put("content", message.getContent());
            receiverMessage.put("type", message.getType().toString());
            receiverMessage.put("sentTime", message.getSentTime());
            receiverMessage.put("isRead", message.getIsRead());

            // 发送消息给接收者
            messagingTemplate.convertAndSendToUser(
                    message.getReceiverId().toString(),
                    "/queue/messages",
                    receiverMessage
            );

            // 创建发送给发送者的确认消息对象
            Map<String, Object> confirmationMessage = new HashMap<>(receiverMessage);
            // 如果有客户端消息ID，添加到确认消息中
            if (clientMessageId != null) {
                confirmationMessage.put("clientMessageId", clientMessageId);
            }
            confirmationMessage.put("status", "DELIVERED");

            // 发送确认消息给发送者
            messagingTemplate.convertAndSendToUser(
                    message.getSenderId().toString(),
                    "/queue/messages",
                    confirmationMessage
            );

            // 通知接收者更新未读消息数量
            long unreadCount = messageService.getUnreadMessageCountBetweenUsers(message.getSenderId(), message.getReceiverId());
            sendUnreadCountUpdate(message.getReceiverId(), message.getSenderId(), unreadCount);

            // 通知发送者更新未读消息数量
            Map<String, Object> unreadCountUpdate = new HashMap<>();
            unreadCountUpdate.put("senderId", message.getReceiverId());
            unreadCountUpdate.put("unreadCount", 0);
            messagingTemplate.convertAndSendToUser(
                    message.getSenderId().toString(),
                    "/queue/unread-count",
                    unreadCountUpdate
            );
        } catch (Exception e) {
            // 发送错误信息给前端
            sendErrorMessage("消息发送失败: " + e.getMessage(), "SEND_ERROR", headerAccessor);
        }
    }

    /**
     * 处理客户端心跳请求
     */
    @MessageMapping("/chat.heartbeat")
    public void handleHeartbeat(@Payload Map<String, Object> payload, StompHeaderAccessor headerAccessor) {
        // 从认证信息中获取用户ID
        Long userId = WebSocketUtils.extractUserId(headerAccessor);

        if (userId != null) {
            // 更新用户的最后心跳时间
            lastHeartbeatTimes.put(userId, System.currentTimeMillis());

            // 发送心跳响应
            Map<String, Object> response = new HashMap<>();
            response.put("type", "HEARTBEAT_ACK");
            response.put("timestamp", System.currentTimeMillis());

            // 使用专门的心跳队列
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/heartbeat",
                    response
            );

            // 静默更新用户在线状态，但不发送通知
            // 这样可以确保用户在心跳期间保持在线状态
            userService.setUserOnline(userId, true);
        }
    }

    /**
     * 检查心跳超时的用户
     * 每分钟执行一次
     */
    @Scheduled(fixedRate = 60000)
    public void checkHeartbeats() {
        long currentTime = System.currentTimeMillis();

        // 检查每个用户的最后心跳时间
        lastHeartbeatTimes.forEach((userId, lastHeartbeat) -> {
            if (currentTime - lastHeartbeat > HEARTBEAT_TIMEOUT) {
                // 用户心跳超时，标记为离线
                userService.setUserOnline(userId, false);
                // 从心跳Map中移除
                lastHeartbeatTimes.remove(userId);
                // 通知其他用户状态变更
                notifyOnlineUsers();
            }
        });
    }


    @MessageMapping("/chat.addUser")
    public void addUser(StompHeaderAccessor headerAccessor) {
        // 仅从认证对象中提取用户ID，确保用户已通过认证
        Long userId = WebSocketUtils.extractUserIdFromAuthentication(headerAccessor);

        // 如果没有有效的userId，表示用户未通过认证
        if (userId == null) {
            System.err.println("无法添加用户，因为用户未通过认证");
            return;
        }

        // 记录用户的心跳时间
        lastHeartbeatTimes.put(userId, System.currentTimeMillis());

        // 将经过认证的用户ID存储到会话中
        Objects.requireNonNull(headerAccessor.getSessionAttributes()).put("userId", userId);

        // 更新用户在线状态
        userService.setUserOnline(userId, true);
        
        // 通知所有用户在线状态变更
        notifyOnlineUsers();
    }

    /**
     * 处理标记消息为已读的请求
     */
    @MessageMapping("/chat.markAsRead")
    public void markMessagesAsRead(@Payload Map<String, Object> payload, StompHeaderAccessor headerAccessor) {
        // 从认证信息中获取当前用户ID（接收者）
        Long currentUserId = WebSocketUtils.extractUserId(headerAccessor);

        if (currentUserId == null) {
            System.err.println("无法标记消息为已读，因为无法确定当前用户ID");
            return;
        }

        try {
            // 获取发送者ID
            Long senderId = Long.valueOf(payload.get("senderId").toString());

            // 将该发送者发送给当前用户的所有未读消息标记为已读
            messageService.markAllMessagesAsRead(senderId, currentUserId);

            // 获取更新后的未读消息数量（应该为0）
            long unreadCount = messageService.getUnreadMessageCountBetweenUsers(senderId, currentUserId);

            // 通知当前用户更新未读消息数量
            sendUnreadCountUpdate(currentUserId, senderId, unreadCount);

            // 检查消息发送者是否允许接收已读回执
            User sender = userService.getUserById(senderId);
            if (sender != null && Boolean.TRUE.equals(sender.getShowReadStatus())) {
                // 向发送者发送已读回执
                Map<String, Object> readReceipt = new HashMap<>();
                readReceipt.put("type", "READ_RECEIPT");
                readReceipt.put("readerId", currentUserId);
                readReceipt.put("timestamp", System.currentTimeMillis());

                messagingTemplate.convertAndSendToUser(
                        senderId.toString(),
                        "/queue/read-receipts",
                        readReceipt
                );

                System.out.println("用户 " + currentUserId + " 已将来自用户 " + senderId + " 的所有消息标记为已读，并发送已读回执");
            } else {
                System.out.println("用户 " + currentUserId + " 已将来自用户 " + senderId + " 的所有消息标记为已读，但未发送已读回执（已禁用）");
            }
        } catch (Exception e) {
            // 发送错误信息给前端
            sendErrorMessage("标记消息为已读失败: " + e.getMessage(), "MARK_READ_ERROR", headerAccessor);
        }
    }

    public void sendUnreadCountUpdate(Long userId, Long senderId, Long unreadCount) {
        // 通知用户更新未读消息数量
        Map<String, Object> unreadCountUpdate = new HashMap<>();
        unreadCountUpdate.put("senderId", senderId);
        unreadCountUpdate.put("unreadCount", unreadCount);
        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/unread-count",
                unreadCountUpdate
        );
    }

    // 发送错误信息给客户端
    private void sendErrorMessage(String message, String errorCode, StompHeaderAccessor headerAccessor) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("type", "ERROR");
        errorResponse.put("message", message);
        errorResponse.put("errorCode", errorCode);

        // 获取用户ID
        Long userId = WebSocketUtils.extractUserId(headerAccessor);
        // 即使userId为空，也尝试发送错误信息
        if (userId != null) {
            messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/errors", errorResponse);
        } else {
            // 如果userId为空，记录错误日志
            System.err.println("无法发送错误信息给用户，因为userId为空。错误信息: " + message);
        }
    }

    // 向指定用户发送错误信息
    private void sendErrorMessageToUser(String message, String errorCode, Long userId) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("type", "ERROR");
        errorResponse.put("message", message);
        errorResponse.put("errorCode", errorCode);

        // 向指定用户发送错误信息
        if (userId != null) {
            messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/errors", errorResponse);
        } else {
            // 如果userId为空，记录错误日志
            System.err.println("无法发送错误信息给用户，因为userId为空。错误信息: " + message);
        }
    }

    public void notifyOnlineUsers() {
        // 通知所有用户在线状态
        List<User> onlineUsers = userService.getOnlineUsers();
        messagingTemplate.convertAndSend("/topic/online-users", onlineUsers);
    }
}