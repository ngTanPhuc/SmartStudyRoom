package com.aiot.backend.service;

import com.aiot.backend.dto.request.UserRequest;
import com.aiot.backend.dto.response.UserResponse;
import com.aiot.backend.entity.Device;
import com.aiot.backend.entity.Sensor;
import com.aiot.backend.entity.User;
import com.aiot.backend.enums.DeviceType;
import com.aiot.backend.enums.SensorType;
import com.aiot.backend.exception.ErrorCode;
import com.aiot.backend.exception.WebException;
import com.aiot.backend.mapper.DeviceMapper;
import com.aiot.backend.mapper.SensorMapper;
import com.aiot.backend.mapper.UserMapper;
import com.aiot.backend.repository.DeviceRepository;
import com.aiot.backend.repository.SensorRepository;
import com.aiot.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    UserRepository userRepository;
    UserMapper userMapper;

    DeviceRepository deviceRepository;
    DeviceMapper deviceMapper;

    SensorRepository sensorRepository;
    SensorMapper sensorMapper;

    // CREATE USER (REGISTER)
    @Transactional
    public UserResponse createUser(UserRequest request) {
        if (userRepository.existsByEmail(request.getEmail()))
            throw new WebException(ErrorCode.EMAIL_ALREADY_EXISTS);
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone()))
            throw new WebException(ErrorCode.PHONE_ALREADY_EXISTS);

        User user = userMapper.toEntity(request);
        userRepository.save(user);

        Device fan = Device.builder()
                .deviceType(DeviceType.FAN)
                .intensityLevel(0)
                .user(user)
                .build();
        deviceRepository.save(fan);
        Device lightDevice = Device.builder()
                .deviceType(DeviceType.LIGHT)
                .intensityLevel(0)
                .user(user)
                .build();
        deviceRepository.save(lightDevice);

        Sensor humidity = Sensor.builder()
                .sensorType(SensorType.HUMIDITY)
                .user(user)
                .build();
        sensorRepository.save(humidity);
        Sensor lightSensor = Sensor.builder()
                .sensorType(SensorType.LIGHT)
                .user(user)
                .build();
        sensorRepository.save(lightSensor);
        Sensor temperature = Sensor.builder()
                .sensorType(SensorType.TEMPERATURE)
                .user(user)
                .build();
        sensorRepository.save(temperature);

        return userMapper.toResponse(user);
    }

    @PreAuthorize("hasAuthority('SCOPE_ADMIN')")
    public List<UserResponse> getUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toResponse)
                .toList();
    }

    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    public User getRawUser(String userId) {
        return userRepository.findById(userId).orElseThrow(
                () -> new WebException(ErrorCode.USER_NOT_FOUND)
        );
    }

    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    public UserResponse getUser(String userId) {
        User user = getRawUser(userId);
        return userMapper.toResponse(user);
    }

    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();
        return userMapper.toResponse(getRawUser(name));
    }

    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    public UserResponse updateUser(UserRequest request, String userId) {
        User user = getRawUser(userId);

        if (request.getEmail() != null
                && !request.getEmail().equals(user.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new WebException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        if (request.getPhone() != null
                && !request.getPhone().equals(user.getPhone())
                && userRepository.existsByPhone(request.getPhone())) {
            throw new WebException(ErrorCode.PHONE_ALREADY_EXISTS);
        }

        user = userMapper.toEntity(request, user);
        userRepository.save(user);

        return userMapper.toResponse(user);
    }

    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    public void deleteUser(String userId) {
        User user = getRawUser(userId);
        userRepository.delete(user);
    }
}
