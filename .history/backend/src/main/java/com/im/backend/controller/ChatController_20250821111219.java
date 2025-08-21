package com.im.backend.controller;

import com.im.backend.model.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload Message message) {
        // 设置消息发送时间
        message.setSentTime(LocalDateTime.now());
        
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
    }

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload Message message) {
        // 用户上线通知
        message.setType(Message.MessageType.TEXT);
        message.setContent("用户 " + message.getSenderId() + " 已上线");
        message.setSentTime(LocalDateTime.now());
        
        // 广播用户上线消息
        messagingTemplate.convertAndSend("/topic/public", message);
    }
}
