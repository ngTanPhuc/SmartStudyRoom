package com.aiot.backend.dto.iot;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ControlRequest {
    String deviceType;
    Integer value;
}
