package com.im.backend.repository;

import com.im.backend.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    List<Message> findByReceiverIdAndIsReadFalse(Long receiverId);
    
    List<Message> findBySenderIdAndReceiverIdAndIsReadFalse(Long senderId, Long receiverId);
    
    List<Message> findByReceiverIdOrSenderIdOrderBySentTimeDesc(Long receiverId, Long senderId);
    
    long countByReceiverIdAndIsReadFalse(Long receiverId);
    
    long countBySenderIdAndReceiverIdAndIsReadFalse(Long senderId, Long receiverId);
    
    @Query("SELECT m FROM Message m WHERE (m.senderId = :senderId AND m.receiverId = :receiverId) OR (m.senderId = :receiverId AND m.receiverId = :senderId) ORDER BY m.sentTime ASC")
    List<Message> findMessagesBetweenUsers(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);
}
