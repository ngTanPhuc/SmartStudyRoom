package com.aiot.backend.service;

import com.aiot.backend.dto.iot.SensorDataRequest;
import com.aiot.backend.dto.response.SensorDataResponse;
import com.aiot.backend.dto.response.SensorResponse;
import com.aiot.backend.entity.Sensor;
import com.aiot.backend.entity.SensorData;
import com.aiot.backend.entity.SensorDataId;
import com.aiot.backend.exception.ErrorCode;
import com.aiot.backend.exception.WebException;
import com.aiot.backend.mapper.SensorMapper;
import com.aiot.backend.repository.SensorDataRepository;
import com.aiot.backend.repository.SensorRepository;
import com.aiot.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SensorService {
    UserRepository userRepository;

    SensorRepository sensorRepository;

    SensorDataRepository sensorDataRepository;

    SensorMapper sensorMapper;

    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    public List<SensorResponse> getSensors(String userId) {
        List<Sensor> sensors = sensorRepository.findByUser_Id(userId);

        return sensors.stream().map(sensor -> {
            SensorResponse res = sensorMapper.toResponse(sensor);
            sensorDataRepository
                    .findTopById_SensorIdOrderById_TimestampDesc(sensor.getId())
                    .ifPresent(data -> res.setCurrentValue(data.getValue()));
            return res;
        }).toList();
    }

    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    public Sensor getRawSensor(String userId, String sensorId) {
        return sensorRepository.findByIdAndUser_Id(sensorId, userId).orElseThrow(
                () -> new WebException(ErrorCode.SENSOR_NOT_FOUND)
        );
    }

    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    public SensorResponse getSensor(String userId, String sensorId) {
        Sensor sensor = getRawSensor(userId, sensorId);
        SensorResponse response = sensorMapper.toResponse(sensor);
        sensorDataRepository
                .findTopById_SensorIdOrderById_TimestampDesc(sensor.getId())
                .ifPresent(data -> response.setCurrentValue(data.getValue()));
        return response;
    }

    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    public List<SensorDataResponse> getSensorData(String userId, String sensorId) {
        Sensor sensor = getRawSensor(userId, sensorId);
        List<SensorData> sensorDataList = sensorDataRepository.findById_SensorIdOrderById_TimestampDesc(sensorId);
        return sensorMapper.toResponse(sensorDataList);
    }

    @Transactional
    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    public int deleteSensorData(String userId, String sensorId, LocalDateTime from, LocalDateTime to) {
        getRawSensor(userId, sensorId);

        if (from != null && to != null && from.isAfter(to)) {
            throw new WebException(ErrorCode.INVALID_REQUEST);
        }

        if (from != null && to != null) {
            return sensorDataRepository.deleteBySensorIdAndTimestampBetween(sensorId, from, to);
        }

        if (to != null) {
            return sensorDataRepository.deleteBySensorIdAndTimestampBeforeOrEqual(sensorId, to);
        }

        if (from != null) {
            return sensorDataRepository.deleteBySensorIdAndTimestampAfterOrEqual(sensorId, from);
        }

        return sensorDataRepository.deleteBySensorId(sensorId);
    }

    public void handleSensorData(String userId, SensorDataRequest request) {
        if (userId == null || userId.isBlank() || request.getSensorType() == null || request.getValue() == null) {
            throw new WebException(ErrorCode.INVALID_REQUEST);
        }
        if (!userRepository.existsById(userId)) {
            throw new WebException(ErrorCode.USER_NOT_FOUND);
        }

        Sensor sensor = sensorRepository
                .findByUser_IdAndSensorType(userId, request.getSensorType())
                .orElseThrow(() -> new WebException(ErrorCode.SENSOR_NOT_FOUND));

        SensorData sensorData = SensorData.builder()
                .id(SensorDataId.builder()
                        .sensorId(sensor.getId())
                        .timestamp(LocalDateTime.now())
                        .build())
                .value(request.getValue())
                .build();

        sensorDataRepository.save(sensorData);
    }
}
