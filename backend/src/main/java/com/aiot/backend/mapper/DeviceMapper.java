package com.aiot.backend.mapper;

import com.aiot.backend.dto.response.DeviceResponse;
import com.aiot.backend.entity.Device;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

@NoArgsConstructor
@Component
public class DeviceMapper {
    public DeviceResponse toResponse(Device device) {
        return DeviceResponse.builder()
                .id(device.getId())
                .deviceType(device.getDeviceType())
                .intensityLevel(device.getIntensityLevel())
                .build();
    }
}
