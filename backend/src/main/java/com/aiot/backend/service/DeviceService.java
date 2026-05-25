package com.aiot.backend.service;

import com.aiot.backend.dto.request.DeviceControlRequest;
import com.aiot.backend.dto.response.CommandResponse;
import com.aiot.backend.dto.response.DeviceResponse;
import com.aiot.backend.entity.Command;
import com.aiot.backend.entity.Device;
import com.aiot.backend.enums.CommandType;
import com.aiot.backend.enums.DeviceType;
import com.aiot.backend.exception.ErrorCode;
import com.aiot.backend.exception.WebException;
import com.aiot.backend.mapper.CommandMapper;
import com.aiot.backend.mapper.DeviceMapper;
import com.aiot.backend.repository.CommandRepository;
import com.aiot.backend.repository.DeviceRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DeviceService {
    DeviceRepository deviceRepository;

    CommandRepository commandRepository;

    CommandService commandService;

    CommandMapper commandMapper;

    DeviceMapper deviceMapper;

    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    public List<DeviceResponse> getDevices(String userId) {
        List<Device> devices = deviceRepository.findByUser_Id(userId);
        return devices.stream().map(
                data -> deviceMapper.toResponse(data)
        ).toList();
    }

    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    public Device getRawDevice(String userId, String deviceId) {
        return deviceRepository.findByIdAndUser_Id(deviceId, userId).orElseThrow(
                () -> new WebException(ErrorCode.DEVICE_NOT_FOUND)
        );
    }

    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    public DeviceResponse getDevice(String userId, String deviceId) {
        Device device = getRawDevice(userId, deviceId);
        return deviceMapper.toResponse(device);
    }

    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    @Transactional
    public CommandResponse controlDevice(String userId, String deviceId,
                                         DeviceControlRequest request) {
        Device device = getRawDevice(userId, deviceId);
        if (request.getTargetValue() == null) {
            throw new WebException(ErrorCode.INVALID_REQUEST);
        }

        Integer oldLevel = device.getIntensityLevel();
        Integer newLevel = normalizeTargetValue(device.getDeviceType(), request.getTargetValue());

        device.setIntensityLevel(newLevel);
        deviceRepository.save(device);

        Command command = Command.builder()
                .commandType(CommandType.MANUAL)
                .device(device)
                .previousIntensity(oldLevel)
                .currentIntensity(newLevel)
                .user(device.getUser())
                .build();
        commandRepository.save(command);

        commandService.sendCmdToGateway(command);
        return commandMapper.toResponse(command);
    }

    private Integer normalizeTargetValue(DeviceType deviceType, Integer targetValue) {
        int clamped = Math.max(0, Math.min(100, targetValue));
        if (deviceType == DeviceType.LIGHT) {
            return clamped > 0 ? 100 : 0;
        }
        return clamped;
    }
}
