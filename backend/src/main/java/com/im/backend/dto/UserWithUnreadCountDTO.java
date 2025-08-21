package com.im.backend.dto;

import com.im.backend.model.User;
import lombok.Data;

@Data
public class UserWithUnreadCountDTO {
    private User user;
    private Long unreadCount;
    
    public UserWithUnreadCountDTO(User user, Long unreadCount) {
        this.user = user;
        this.unreadCount = unreadCount;
    }
}