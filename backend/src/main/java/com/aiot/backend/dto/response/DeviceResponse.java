package com.aiot.backend.dto.response;

import com.aiot.backend.enums.DeviceType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Builder(toBuilder = true)
@Getter
@Setter
public class DeviceResponse {
    String id;
    DeviceType deviceType;
    Integer intensityLevel;
}
