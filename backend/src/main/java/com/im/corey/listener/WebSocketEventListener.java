package com.im.corey.listener;

import com.im.corey.service.UserService;
import com.im.corey.util.WebSocketUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener {

    @Autowired
    private UserService userService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        // 用户连接时的处理逻辑（如果需要）
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        // 从会话中获取用户ID
        Long userId = WebSocketUtils.extractUserId(headerAccessor);

        if (userId != null) {
            // 将用户标记为离线
            userService.setUserOnline(userId, false);

            // 通知其他用户状态变更
            messagingTemplate.convertAndSend("/topic/online-users", userService.getOnlineUsers());

            System.out.println("用户 " + userId + " 已断开连接并标记为离线");
        }
    }
}