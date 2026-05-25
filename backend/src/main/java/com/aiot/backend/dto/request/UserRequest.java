package com.aiot.backend.dto.request;

import lombok.Getter;

@Getter
public class UserRequest {
    String email;
    String phone;
    String password;
    String firstName;
    String lastName;
}
