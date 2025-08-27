package com.im.backend.controller;

import com.im.backend.dto.*;
import com.im.backend.model.User;
import com.im.backend.service.UserService;
import com.im.backend.util.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.im.backend.dto.PasswordVerificationDTO;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/with-unread-count")
    public ResponseEntity<List<UserWithUnreadCountDTO>> getAllUsersWithUnreadCount() {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.status(401).build(); // 未授权
        }
        List<UserWithUnreadCountDTO> usersWithUnreadCount = userService.getAllUsersWithUnreadCount(currentUserId);
        return ResponseEntity.ok(usersWithUnreadCount);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (userService.deleteUser(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/online")
    public ResponseEntity<List<User>> getOnlineUsers() {
        return ResponseEntity.ok(userService.getOnlineUsers());
    }


    @PutMapping("/updateUser")
    public ResponseEntity<User> updateUser(@RequestBody UpdateUserDTO user) {
        Long id = SecurityUtil.getCurrentUserId();
        User updatedUser = userService.updateUser(id, user);
        if (updatedUser != null) {
            return ResponseEntity.ok(updatedUser);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordDTO changePasswordDTO) {
        try {
            Long id = SecurityUtil.getCurrentUserId();
            User updatedUser = userService.changePassword(id, changePasswordDTO.getOldPassword(), changePasswordDTO.getNewPassword(),
                    changePasswordDTO.getEmail());
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/verify-password")
    public ResponseEntity<?> verifyPassword(@RequestBody PasswordVerificationDTO passwordVerificationDTO) {
        try {
            Long id = SecurityUtil.getCurrentUserId();
            boolean isCorrect = userService.verifyPassword(id, passwordVerificationDTO.getPassword());
            if (!isCorrect) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("密码错误");
            }
            return ResponseEntity.ok(true);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("验证密码时发生错误");
        }
    }
}
