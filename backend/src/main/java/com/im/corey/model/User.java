package com.im.corey.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@TableName("users")
@Table(name = "users")
public class User {
    
    /**
     * 用户ID
     */
    @Id
    @TableId(type = IdType.AUTO)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 用户名
     */
    @Column(unique = true, nullable = false)
    private String username;
    
    /**
     * 密码
     */
    @Column(nullable = false)
    @JsonIgnore
    private String password;
    
    /**
     * 邮箱
     */
    @Column(unique = true, nullable = false)
    private String email;
    
    /**
     * 昵称
     */
    private String nickname;
    
    /**
     * 头像
     */
    private String avatar;
    
    /**
     * 是否在线
     */
    @Column(name = "is_online")
    private Boolean isOnline = false;
    
    /**
     * 是否显示已读状态
     */
    @Column(name = "show_read_status")
    private Boolean showReadStatus = false;
    
    /**
     * 最后登录时间
     */
    @Column(name = "last_login_time")
    private LocalDateTime lastLoginTime;
    
    /**
     * 创建时间
     */
    @Column(name = "created_time")
    private LocalDateTime createdTime;
    
    /**
     * 更新时间
     */
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;
}
