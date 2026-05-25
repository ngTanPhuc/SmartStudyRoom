package com.aiot.backend.dto.response;

import com.aiot.backend.enums.Operator;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Builder(toBuilder = true)
@Getter
@Setter
public class AutoRuleResponse {
    String id;
    String description;
    Boolean active;
    Operator operator;
    Double thresh;
    SensorResponse sensorResponse;
    DeviceResponse deviceResponse;
    Integer targetValue;
}
