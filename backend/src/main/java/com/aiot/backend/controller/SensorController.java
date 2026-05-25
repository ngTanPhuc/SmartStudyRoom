package com.aiot.backend.controller;

import com.aiot.backend.dto.response.ApiResponse;
import com.aiot.backend.dto.response.SensorDataResponse;
import com.aiot.backend.dto.response.SensorResponse;
import com.aiot.backend.service.SensorService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("users/{userId}/sensors")
public class SensorController {
    SensorService sensorService;

    @GetMapping
    public ApiResponse<List<SensorResponse>> getSensors(@PathVariable("userId") String userId) {
        List<SensorResponse> response = sensorService.getSensors(userId);
        return ApiResponse.<List<SensorResponse>>builder()
                .result(response)
                .build();
    }

    @GetMapping("/{sensorId}")
    public ApiResponse<SensorResponse> getSensor(@PathVariable("userId") String userId,
                                                 @PathVariable("sensorId") String sensorId) {
        SensorResponse response = sensorService.getSensor(userId, sensorId);
        return ApiResponse.<SensorResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/{sensorId}/data")
    public ApiResponse<List<SensorDataResponse>> getSensorData(@PathVariable("userId") String userId,
                                                     @PathVariable("sensorId") String sensorId) {
        List<SensorDataResponse> response = sensorService.getSensorData(userId, sensorId);
        return ApiResponse.<List<SensorDataResponse>>builder()
                .result(response)
                .build();
    }
}
