package com.im.backend.controller;

import com.im.backend.dto.LoginRequestDTO;
import com.im.backend.dto.RegisterUserDTO;
import com.im.backend.dto.ResetPasswordDTO;
import com.im.backend.dto.VerifyEmailDTO;
import com.im.backend.model.User;
import com.im.backend.service.UserService;
import com.im.backend.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/open")
public class OpenController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequest) {
        try {
            // 使用UserService进行账号密码校验
            User user = userService.authenticateUser(loginRequest.getUsername(), loginRequest.getPassword());
            if (user == null) {
                return ResponseEntity.status(401).body("用户名或密码错误");
            }

            // 生成JWT token
            String token = jwtUtil.generateToken(user.getId());

            // 返回token和用户信息
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", user);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("认证失败");
        }
    }

    /**
     * 用户注册
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterUserDTO registerUserDTO) {
        try {
            User newUser = userService.createUser(registerUserDTO);
            return ResponseEntity.ok(newUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("注册失败: " + e.getMessage());
        }
    }

    /**
     * 验证用户邮箱（用于忘记密码）
     */
    @PostMapping("/verify-email")
    public ResponseEntity<Boolean> verifyUserEmail(@RequestBody VerifyEmailDTO verifyEmailDTO) {
        try {
            boolean isValid = userService.verifyUserEmail(verifyEmailDTO.getUsername(), verifyEmailDTO.getEmail());
            return ResponseEntity.ok(isValid);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(false);
        }
    }

    /**
     * 重置密码
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordDTO resetPasswordDTO) {
        try {
            userService.resetPassword(
                    resetPasswordDTO.getUsername(),
                    resetPasswordDTO.getEmail(),
                    resetPasswordDTO.getNewPassword());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("重置密码失败: " + e.getMessage());
        }
    }
}