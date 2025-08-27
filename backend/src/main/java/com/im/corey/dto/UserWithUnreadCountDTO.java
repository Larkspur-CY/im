package com.im.corey.dto;

import com.im.corey.model.User;
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