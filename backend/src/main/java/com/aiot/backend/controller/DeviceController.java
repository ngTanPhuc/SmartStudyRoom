package com.aiot.backend.controller;

import com.aiot.backend.dto.request.DeviceControlRequest;
import com.aiot.backend.dto.response.ApiResponse;
import com.aiot.backend.dto.response.CommandResponse;
import com.aiot.backend.dto.response.DeviceResponse;
import com.aiot.backend.service.DeviceService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("users/{userId}/devices")
public class DeviceController {
    DeviceService deviceService;

    @GetMapping
    public ApiResponse<List<DeviceResponse>> getDevices(@PathVariable("userId") String userId) {
        List<DeviceResponse> response = deviceService.getDevices(userId);
        return ApiResponse.<List<DeviceResponse>>builder()
                .result(response)
                .build();
    }

    @GetMapping("/{deviceId}")
    public ApiResponse<DeviceResponse> getDevice(@PathVariable("userId") String userId,
                                                 @PathVariable("deviceId") String deviceId) {
        DeviceResponse response = deviceService.getDevice(userId, deviceId);
        return ApiResponse.<DeviceResponse>builder()
                .result(response)
                .build();
    }

    @PostMapping("/{deviceId}/control")
    public ApiResponse<CommandResponse> controlDevice(@PathVariable("userId") String userId,
                                                      @PathVariable("deviceId") String deviceId,
                                                      @RequestBody DeviceControlRequest request) {
        CommandResponse response = deviceService.controlDevice(userId, deviceId, request);
        return ApiResponse.<CommandResponse>builder()
                .result(response)
                .build();
    }
}
