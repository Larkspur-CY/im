package com.im.backend.service;

import com.im.backend.dto.RegisterUserDTO;
import com.im.backend.dto.UpdateUserDTO;
import com.im.backend.model.User;
import com.im.backend.repository.UserRepository;
import com.im.backend.service.MessageService;
import com.im.backend.dto.UserWithUnreadCountDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private MessageService messageService;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public List<UserWithUnreadCountDTO> getAllUsersWithUnreadCount(Long currentUserId) {
        List<User> users = userRepository.findAll();
        return users.stream().map(user -> {
            Long unreadCount = messageService.getUnreadMessageCountBetweenUsers(user.getId(), currentUserId);
            return new UserWithUnreadCountDTO(user, unreadCount);
        }).collect(Collectors.toList());
    }

    public User getUserById(Long id) {
        Optional<User> user = userRepository.findById(id);
        return user.orElse(null);
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User createUser(User user) {
        // 检查用户名是否已存在
        if (userRepository.findByUsername(user.getUsername()) != null) {
            throw new RuntimeException("用户名已存在");
        }
        
        // 检查邮箱是否已存在
        if (userRepository.findByEmail(user.getEmail()) != null) {
            throw new RuntimeException("邮箱已存在");
        }

        // 加密密码
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setCreatedTime(LocalDateTime.now());
        user.setUpdatedTime(LocalDateTime.now());
        user.setIsOnline(false);

        return userRepository.save(user);
    }
    
    public User createUser(RegisterUserDTO userDto) {
        User user = new User();
        user.setUsername(userDto.getUsername());
        user.setPassword(userDto.getPassword());
        user.setEmail(userDto.getEmail());
        user.setNickname(userDto.getNickname());
        user.setAvatar(userDto.getAvatar());
        
        return createUser(user);
    }

    public User authenticateUser(String username, String password) {
        User user = userRepository.findByUsername(username);
        if (user != null && passwordEncoder.matches(password, user.getPassword())) {
            // 更新最后登录时间和在线状态
            user.setLastLoginTime(LocalDateTime.now());
            user.setIsOnline(true);
            return userRepository.save(user);
        }
        return null;
    }

    public User updateUser(Long id, User userDetails) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            
            if (userDetails.getNickname() != null) {
                user.setNickname(userDetails.getNickname());
            }
            if (userDetails.getAvatar() != null) {
                user.setAvatar(userDetails.getAvatar());
            }
            if (userDetails.getEmail() != null) {
                user.setEmail(userDetails.getEmail());
            }
            
            user.setUpdatedTime(LocalDateTime.now());
            return userRepository.save(user);
        }
        return null;
    }
    
    public User updateUser(Long id, UpdateUserDTO userDto) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            
            if (userDto.getNickname() != null) {
                user.setNickname(userDto.getNickname());
            }
            if (userDto.getAvatar() != null) {
                user.setAvatar(userDto.getAvatar());
            }
            if (userDto.getEmail() != null) {
                user.setEmail(userDto.getEmail());
            }
            
            user.setUpdatedTime(LocalDateTime.now());
            return userRepository.save(user);
        }
        return null;
    }

    public boolean deleteUser(Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public List<User> getOnlineUsers() {
        return userRepository.findByIsOnlineTrue();
    }

    public void setUserOnline(Long userId, boolean online) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            user.setIsOnline(online);
            if (!online) {
                user.setLastLoginTime(LocalDateTime.now());
            }
            userRepository.save(user);
        }
    }
    
    /**
     * 验证用户名和邮箱是否匹配
     * @param username 用户名
     * @param email 邮箱
     * @return 如果匹配返回true，否则返回false
     */
    public boolean verifyUserEmail(String username, String email) {
        User user = userRepository.findByUsername(username);
        if (user != null && user.getEmail().equals(email)) {
            return true;
        }
        return false;
    }
    
    /**
     * 重置用户密码
     * @param username 用户名
     * @param email 邮箱
     * @param newPassword 新密码
     * @return 更新后的用户对象
     */
    public User resetPassword(String username, String email, String newPassword) {
        User user = userRepository.findByUsername(username);
        if (user != null && user.getEmail().equals(email)) {
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setUpdatedTime(LocalDateTime.now());
            return userRepository.save(user);
        }
        throw new RuntimeException("用户名或邮箱不正确");
    }
}
