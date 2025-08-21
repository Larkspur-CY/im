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
    public void sendMessage(@Payload Message message) {
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
    
    public void notifyOnlineUsers() {
        // 通知所有用户在线状态
        List<User> onlineUsers = userService.getOnlineUsers();
        messagingTemplate.convertAndSend("/topic/online-users", onlineUsers);
    }
}
