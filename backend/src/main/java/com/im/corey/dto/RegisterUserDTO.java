package com.im.corey.dto;

import lombok.Data;

@Data
public class RegisterUserDTO {
    private String username;
    private String password;
    private String email;
    private String nickname;
    private String avatar;
}