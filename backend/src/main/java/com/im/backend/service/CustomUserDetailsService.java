package com.im.backend.service;

import com.im.backend.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserService userService;

    @Override
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        User user = userService.getUserById(Long.valueOf(userId));
        if (user == null) {
            throw new UsernameNotFoundException("User not found with id: " + userId);
        }
        return new org.springframework.security.core.userdetails.User(
                user.getId().toString(),
                user.getPassword(),
                new ArrayList<>()
        );
    }
}