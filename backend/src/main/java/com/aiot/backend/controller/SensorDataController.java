package com.aiot.backend.controller;

import com.aiot.backend.dto.IotEdge.SensorDataRequest;
import com.aiot.backend.dto.response.ApiResponse;
import com.aiot.backend.exception.ErrorCode;
import com.aiot.backend.exception.WebException;
import com.aiot.backend.service.SensorService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SensorDataController {
    SensorService sensorService;

    @PostMapping({"/iot/sensor-data", "/sensor-data", "/sensors/sensor-data"})
    public ApiResponse receiveData(@RequestBody SensorDataRequest request) {
        String userId = request.getUserId();
        if (userId == null || userId.isBlank()) {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
                throw new WebException(ErrorCode.INVALID_REQUEST);
            }
            userId = authentication.getName();
        }

        sensorService.handleSensorData(userId, request);
        return ApiResponse.builder().build();
    }
}
