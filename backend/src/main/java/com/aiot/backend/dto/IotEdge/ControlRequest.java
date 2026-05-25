package com.aiot.backend.dto.IotEdge;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ControlRequest {
    String deviceType;
    Integer value;     // 0-100 hoặc 0/1
}
