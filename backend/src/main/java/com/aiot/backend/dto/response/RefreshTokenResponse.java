package com.aiot.backend.dto.response;

import lombok.Builder;
import lombok.Setter;

@Builder(toBuilder = true)
@Setter
public class RefreshTokenResponse {
    String token;
}
