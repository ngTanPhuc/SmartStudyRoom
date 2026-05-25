package com.aiot.backend.mapper;

import com.aiot.backend.dto.response.SensorDataResponse;
import com.aiot.backend.dto.response.SensorResponse;
import com.aiot.backend.entity.Sensor;
import com.aiot.backend.entity.SensorData;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@NoArgsConstructor
@Component
public class SensorMapper {
    public SensorResponse toResponse(Sensor sensor) {
        return SensorResponse.builder()
                .id(sensor.getId())
                .sensorType(sensor.getSensorType())
                .build();
    }

    public List<SensorDataResponse> toResponse(List<SensorData> sensorData) {
        return sensorData.stream().map(
                data -> SensorDataResponse.builder()
                        .timestamp(data.getId().getTimestamp())
                        .value(data.getValue())
                        .build()
        ).toList();
    }
}
