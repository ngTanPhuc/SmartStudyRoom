package com.aiot.backend.mapper;

import com.aiot.backend.dto.request.UserRequest;
import com.aiot.backend.dto.response.UserResponse;
import com.aiot.backend.entity.User;
import com.aiot.backend.enums.Role;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;

@NoArgsConstructor
@AllArgsConstructor
@Component
public class UserMapper {
    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);

    //Create User
    public User toEntity(UserRequest request) {
        HashSet<String> roles = new HashSet<>();
        roles.add(Role.USER.name());

        return User.builder()
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .roles(roles)
                .build();
    }

    //Update User
    public User toEntity(UserRequest request, User user) {
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getPassword() != null) user.setPassword(passwordEncoder.encode(request.getPassword()));
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        return user;
    }

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .fullName(buildFullName(user))
                .createdAt(user.getCreatedAt())
                .lastUpdated(user.getLastUpdated())
                .lastLogin(user.getLastLogin())
                .roles(user.getRoles())
                .build();
    }

    private String buildFullName(User user) {
        String lastName = user.getLastName() == null ? "" : user.getLastName().trim();
        String firstName = user.getFirstName() == null ? "" : user.getFirstName().trim();
        return (lastName + " " + firstName).trim();
    }
}
