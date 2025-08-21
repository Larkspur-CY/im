package com.im.backend.service;

import com.im.backend.model.Message;
import com.im.backend.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    public Message saveMessage(Message message) {
        message.setSentTime(LocalDateTime.now());
        message.setIsRead(false);
        return messageRepository.save(message);
    }

    public List<Message> getMessagesBetweenUsers(Long senderId, Long receiverId) {
        return messageRepository.findMessagesBetweenUsers(senderId, receiverId);
    }

    public List<Message> getUnreadMessages(Long userId) {
        return messageRepository.findByReceiverIdAndIsReadFalse(userId);
    }

    public void markMessageAsRead(Long messageId) {
        Optional<Message> optionalMessage = messageRepository.findById(messageId);
        if (optionalMessage.isPresent()) {
            Message message = optionalMessage.get();
            message.setIsRead(true);
            messageRepository.save(message);
        }
    }

    public void markAllMessagesAsRead(Long senderId, Long receiverId) {
        List<Message> unreadMessages = messageRepository.findBySenderIdAndReceiverIdAndIsReadFalse(senderId, receiverId);
        for (Message message : unreadMessages) {
            message.setIsRead(true);
        }
        messageRepository.saveAll(unreadMessages);
    }

    public List<Message> getMessageHistory(Long userId) {
        return messageRepository.findByReceiverIdOrSenderIdOrderBySentTimeDesc(userId, userId);
    }

    public long getUnreadMessageCount(Long userId) {
        return messageRepository.countByReceiverIdAndIsReadFalse(userId);
    }

    public long getUnreadMessageCountBetweenUsers(Long senderId, Long receiverId) {
        return messageRepository.countBySenderIdAndReceiverIdAndIsReadFalse(senderId, receiverId);
    }

    public boolean deleteMessage(Long messageId) {
        if (messageRepository.existsById(messageId)) {
            messageRepository.deleteById(messageId);
            return true;
        }
        return false;
    }
}
