package com.aiot.backend.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Set;

@Builder(toBuilder = true)
@Getter
@Setter
public class UserResponse {
    String id;
    String email;
    String phone;
    String firstName;
    String middleName;
    String lastName;
    String fullName;
    LocalDateTime createdAt;
    LocalDateTime lastUpdated;
    LocalDateTime lastLogin;
    Set<String> roles;
}
