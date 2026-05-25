package com.aiot.backend.dto.IotEdge;

import com.aiot.backend.enums.SensorType;
import lombok.Data;

@Data
public class SensorDataRequest {
    String userId;
    SensorType sensorType;
    Double value;
}
