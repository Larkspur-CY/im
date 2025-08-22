package com.im.backend.controller;

import com.im.backend.model.Message;
import com.im.backend.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @PostMapping
    public ResponseEntity<Message> sendMessage(@RequestBody Message message) {
        Message savedMessage = messageService.saveMessage(message);
        return ResponseEntity.ok(savedMessage);
    }

    @GetMapping("/between/{senderId}/{receiverId}")
    public ResponseEntity<List<Message>> getMessagesBetweenUsers(
            @PathVariable Long senderId, 
            @PathVariable Long receiverId) {
        List<Message> messages = messageService.getMessagesBetweenUsers(senderId, receiverId);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/unread/{userId}")
    public ResponseEntity<List<Message>> getUnreadMessages(@PathVariable Long userId) {
        List<Message> unreadMessages = messageService.getUnreadMessages(userId);
        return ResponseEntity.ok(unreadMessages);
    }

    @GetMapping("/unread/count/{userId}")
    public ResponseEntity<Long> getUnreadMessageCount(@PathVariable Long userId) {
        long count = messageService.getUnreadMessageCount(userId);
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/unread/count/{senderId}/{receiverId}")
    public ResponseEntity<Long> getUnreadMessageCountBetweenUsers(
            @PathVariable Long senderId, 
            @PathVariable Long receiverId) {
        long count = messageService.getUnreadMessageCountBetweenUsers(senderId, receiverId);
        return ResponseEntity.ok(count);
    }

    @PutMapping("/read/{messageId}")
    public ResponseEntity<Void> markMessageAsRead(@PathVariable Long messageId) {
        messageService.markMessageAsRead(messageId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read/{senderId}/{receiverId}")
    public ResponseEntity<Void> markAllMessagesAsRead(
            @PathVariable Long senderId, 
            @PathVariable Long receiverId) {
        messageService.markAllMessagesAsRead(senderId, receiverId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<List<Message>> getMessageHistory(@PathVariable Long userId) {
        List<Message> messageHistory = messageService.getMessageHistory(userId);
        return ResponseEntity.ok(messageHistory);
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long messageId) {
        if (messageService.deleteMessage(messageId)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
