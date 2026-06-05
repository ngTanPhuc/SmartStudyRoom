package com.aiot.backend.dto.iot;

import com.aiot.backend.enums.DeviceType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GatewayCommandMessage {
    private String userId;
    private DeviceType deviceType;
    private int value;
}
