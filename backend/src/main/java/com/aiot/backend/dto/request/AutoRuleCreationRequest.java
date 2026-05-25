package com.aiot.backend.dto.request;

import com.aiot.backend.enums.Operator;
import lombok.Getter;

@Getter
public class AutoRuleCreationRequest {
    Operator operator;
    Double thresh;
    String sensorId;
    String deviceId;
    Integer targetValue;
}
