package com.aiot.backend.dto.response;

import com.aiot.backend.enums.SensorType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Builder(toBuilder = true)
@Getter
@Setter
public class SensorResponse {
    String id;
    SensorType sensorType;
    Double currentValue;
}
