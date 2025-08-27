package com.im.backend.controller;

import com.im.backend.model.Message;
import com.im.backend.service.UserService;
import com.im.backend.service.MessageService;
import com.im.backend.model.User;
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

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private UserService userService;

    @Autowired
    private MessageService messageService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload Map<String, Object> messagePayload, StompHeaderAccessor headerAccessor) {
        // 从认证信息中获取发送者ID
        Long senderId = null;
        
        // 从认证对象中获取用户ID
        if (headerAccessor.getUser() != null) {
            // 从认证对象中获取用户名（在我们的系统中，用户名就是用户ID）
            String userIdStr = headerAccessor.getUser().getName();
            try {
                senderId = Long.valueOf(userIdStr);
            } catch (NumberFormatException e) {
                System.err.println("无法解析用户ID: " + userIdStr);
            }
        }
        
        // 如果无法从认证信息中获取用户ID，尝试从会话中获取
        if (senderId == null) {
            senderId = (Long) headerAccessor.getSessionAttributes().get("userId");
        }
        
        // 如果仍然没有有效的senderId，尝试从消息负载中获取（兼容旧版本）
        if (senderId == null && messagePayload.get("senderId") != null) {
            try {
                senderId = Long.valueOf(messagePayload.get("senderId").toString());
                // 向这个senderId发送错误信息
                sendErrorMessageToUser("用户未登录或会话已过期，请重新登录", "AUTH_REQUIRED", senderId);
                return;
            } catch (NumberFormatException e) {
                // 如果senderId格式无效，记录错误
                System.err.println("无效的用户ID格式: " + messagePayload.get("senderId"));
                return;
            }
        }
        
        // 如果仍然没有有效的senderId
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
                    message.setType(Message.MessageType.TEXT); // 默认类型
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

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload Map<String, Object> payload, StompHeaderAccessor headerAccessor) {
        // 从认证信息中获取用户ID
        Long userId = null;
        
        // 从认证对象中获取用户ID
        if (headerAccessor.getUser() != null) {
            // 从认证对象中获取用户名（在我们的系统中，用户名就是用户ID）
            String userIdStr = headerAccessor.getUser().getName();
            try {
                userId = Long.valueOf(userIdStr);
            } catch (NumberFormatException e) {
                System.err.println("无法解析用户ID: " + userIdStr);
            }
        }
        
        // 如果无法从认证信息中获取用户ID，尝试从消息负载中获取（兼容旧版本）
        if (userId == null && payload.get("senderId") != null) {
            try {
                userId = Long.valueOf(payload.get("senderId").toString());
            } catch (NumberFormatException e) {
                System.err.println("无效的用户ID格式: " + payload.get("senderId"));
                return;
            }
        }
        
        // 如果仍然没有有效的userId
        if (userId == null) {
            System.err.println("无法添加用户，因为无法确定用户ID");
            return;
        }
        
        // 将用户ID存储到会话中
        headerAccessor.getSessionAttributes().put("userId", userId);
        
        // 创建消息对象
        Message message = new Message();
        message.setSenderId(userId);
        message.setType(Message.MessageType.TEXT);
        message.setContent("用户 " + userId + " 已上线");
        message.setSentTime(LocalDateTime.now());
        
        // 广播用户上线消息
        messagingTemplate.convertAndSend("/topic/public", message);
        
        // 更新用户在线状态
        userService.setUserOnline(userId, true);
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
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
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
