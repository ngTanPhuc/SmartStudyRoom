package com.aiot.backend.dto.request;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class IntrospectRequest {
    String token;
}