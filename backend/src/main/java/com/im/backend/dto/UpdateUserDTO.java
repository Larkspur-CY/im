package com.im.backend.dto;

import lombok.Data;

@Data
public class UpdateUserDTO {
    private String nickname;
    private String avatar;
    private Boolean showReadStatus;
}
