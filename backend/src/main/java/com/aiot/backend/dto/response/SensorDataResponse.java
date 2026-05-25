package com.aiot.backend.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Builder(toBuilder = true)
@Getter
@Setter
public class SensorDataResponse {
    LocalDateTime timestamp;
    Double value;
}
