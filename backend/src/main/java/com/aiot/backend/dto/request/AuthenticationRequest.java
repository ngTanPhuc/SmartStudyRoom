package com.aiot.backend.dto.request;

import lombok.Getter;

@Getter
public class AuthenticationRequest {
    String identifier;
    String password;
}
