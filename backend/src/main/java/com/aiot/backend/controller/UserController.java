package com.aiot.backend.controller;

import com.aiot.backend.dto.request.UserRequest;
import com.aiot.backend.dto.response.ApiResponse;
import com.aiot.backend.dto.response.UserResponse;
import com.aiot.backend.service.UserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/users")
public class UserController {
    UserService userService;

    @GetMapping
    public ApiResponse<List<UserResponse>> getUsers() {
        List<UserResponse> response = userService.getUsers();
        return ApiResponse.<List<UserResponse>>builder()
                .result(response)
                .build();
    }

    @GetMapping("/{userId}")
    public ApiResponse<UserResponse> getUser (@PathVariable("userId") String userId) {
        UserResponse response = userService.getUser(userId);
        return ApiResponse.<UserResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/my-info")
    public ApiResponse<UserResponse> getMyInfo() {
        UserResponse response = userService.getMyInfo();
        return ApiResponse.<UserResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/{userId}")
    public ApiResponse<UserResponse> updateUser (@PathVariable("userId") String userId, @RequestBody UserRequest request) {
        UserResponse response = userService.updateUser(request, userId);
        return ApiResponse.<UserResponse>builder()
                .result(response)
                .build();
    }

    @DeleteMapping("/{userId}")
    public ApiResponse deleteUser(@PathVariable("userId") String userId) {
        userService.deleteUser(userId);
        return ApiResponse.builder().build();
    }
}
