package com.im.backend.controller;

import com.im.backend.dto.LoginRequestDTO;
import com.im.backend.dto.RegisterUserDTO;
import com.im.backend.model.User;
import com.im.backend.service.UserService;
import com.im.backend.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

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

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterUserDTO registerUserDTO) {
        try {
            User newUser = userService.createUser(registerUserDTO);
            return ResponseEntity.ok(newUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("注册失败: " + e.getMessage());
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7); // 移除"Bearer "前缀
            String userId = jwtUtil.getUserIdFromToken(token);
            User user = userService.getUserById(Long.valueOf(userId));
            
            if (user != null && jwtUtil.validateToken(token, user.getId())) {
                return ResponseEntity.ok(user);
            } else {
                return ResponseEntity.status(401).body("Token无效");
            }
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Token验证失败");
        }
    }
}