package com.im.corey.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@TableName("messages")
@Table(name = "messages")
public class Message {
    
    /**
     * 消息ID
     */
    @Id
    @TableId(type = IdType.AUTO)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 发送者ID
     */
    @Column(name = "sender_id", nullable = false)
    private Long senderId;
    
    /**
     * 接收者ID
     */
    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;
    
    /**
     * 消息内容
     */
    @Column(columnDefinition = "TEXT")
    private String content;
    
    /**
     * 消息类型
     */
    @Enumerated(EnumType.STRING)
    private MessageType type = MessageType.TEXT;
    
    /**
     * 是否已读
     */
    @Column(name = "is_read")
    private Boolean isRead = false;
    
    /**
     * 发送时间
     */
    @Column(name = "sent_time")
    private LocalDateTime sentTime;
    
    public enum MessageType {
        TEXT, IMAGE, FILE, VOICE, VIDEO
    }
}
