package com.im.backend.util;

import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import java.util.Map;

/**
 * WebSocket工具类，提供WebSocket相关的工具方法
 */
public class WebSocketUtils {

    /**
     * 从请求中提取用户ID的通用方法
     * 
     * @param headerAccessor STOMP头部访问器
     * @return 用户ID，如果无法提取则返回null
     */
    public static Long extractUserId(StompHeaderAccessor headerAccessor) {
        Long userId = null;
        
        // 从认证对象中获取用户ID
        if (headerAccessor.getUser() != null) {
            String userIdStr = headerAccessor.getUser().getName();
            try {
                userId = Long.valueOf(userIdStr);
            } catch (NumberFormatException e) {
                System.err.println("无法解析用户ID: " + userIdStr);
            }
        }
        
        // 如果无法从认证信息中获取用户ID，尝试从会话中获取
        if (userId == null) {
            userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        }
        
        return userId;
    }
}