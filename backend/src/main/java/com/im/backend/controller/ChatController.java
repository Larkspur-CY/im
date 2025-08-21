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
        // 从会话中获取发送者ID
        Long senderId = (Long) headerAccessor.getSessionAttributes().get("userId");
        
        // 如果会话中没有userId，尝试从消息负载中获取senderId
        if (senderId == null && messagePayload.get("senderId") != null) {
            try {
                senderId = Long.valueOf(messagePayload.get("senderId").toString());
                // 向这个senderId发送错误信息
                sendErrorMessageToUser("用户未登录或会话已过期", "UNKNOWN", senderId);
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
            System.err.println("无法发送消息，因为用户未登录且消息中未提供有效的senderId");
            return;
        }

        try {
            // 创建消息对象并设置属性
            Message message = new Message();
            message.setSenderId(senderId);
            message.setReceiverId(Long.valueOf(messagePayload.get("receiverId").toString()));
            message.setContent((String) messagePayload.get("content"));

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

            // 发送消息给特定用户
            messagingTemplate.convertAndSendToUser(
                    message.getReceiverId().toString(),
                    "/queue/messages",
                    message
            );

            // 也可以发送给发送者确认消息已发送
            messagingTemplate.convertAndSendToUser(
                    message.getSenderId().toString(),
                    "/queue/messages",
                    message
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
    public void addUser(@Payload Message message, StompHeaderAccessor headerAccessor) {
        // 将用户ID存储到会话中
        headerAccessor.getSessionAttributes().put("userId", message.getSenderId());

        // 用户上线通知
        message.setType(Message.MessageType.TEXT);
        message.setContent("用户 " + message.getSenderId() + " 已上线");
        message.setSentTime(LocalDateTime.now());

        // 广播用户上线消息
        messagingTemplate.convertAndSend("/topic/public", message);

        // 更新用户在线状态
        userService.setUserOnline(message.getSenderId(), true);
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
