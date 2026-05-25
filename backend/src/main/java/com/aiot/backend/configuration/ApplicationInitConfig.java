package com.aiot.backend.configuration;

import com.aiot.backend.entity.Device;
import com.aiot.backend.entity.Sensor;
import com.aiot.backend.entity.User;
import com.aiot.backend.enums.DeviceType;
import com.aiot.backend.enums.Role;
import com.aiot.backend.enums.SensorType;
import com.aiot.backend.repository.DeviceRepository;
import com.aiot.backend.repository.SensorRepository;
import com.aiot.backend.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level= AccessLevel.PRIVATE, makeFinal = true)
public class ApplicationInitConfig {
    private static final String TEST_USER_ID = "c7ab5c64-cee4-4ef6-9b2e-1f71824c0920";
    private static final String TEST_USER_EMAIL = "nvan@gmail.com";
    private static final String TEST_USER_PASSWORD = "123456";

    PasswordEncoder passwordEncoder;
    UserRepository userRepository;
    DeviceRepository deviceRepository;
    SensorRepository sensorRepository;
    JdbcTemplate jdbcTemplate;

    @Bean
    ApplicationRunner applicationRunner() {
        return args -> {
            if (userRepository.findByEmail("admin@gmail.com").isEmpty()) {
                String email = "admin@gmail.com";
                String password = passwordEncoder.encode("admin");
                HashSet<String> roles = new HashSet<>();
                roles.add(Role.ADMIN.name());

                User user = User.builder()
                        .email(email)
                        .password(password)
                        .roles(roles)
                        .build();
                userRepository.save(user);
            }

            ensureTestUserExists();
            User testUser = userRepository.findById(TEST_USER_ID)
                    .orElseThrow(() -> new IllegalStateException("Cannot initialize fixed test user"));

            ensureDefaultDevices(testUser);
            ensureDefaultSensors(testUser);
        };
    }

    private void ensureTestUserExists() {
        if (userRepository.findById(TEST_USER_ID).isPresent()) {
            return;
        }

        if (userRepository.findByEmail(TEST_USER_EMAIL).isPresent()) {
            throw new IllegalStateException(
                    "Email " + TEST_USER_EMAIL + " already exists with another id. " +
                            "Delete or rename that row before seeding fixed test user " + TEST_USER_ID
            );
        }

        jdbcTemplate.update(
                """
                        INSERT INTO `user` (id, email, password, first_name, last_name)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                TEST_USER_ID,
                TEST_USER_EMAIL,
                passwordEncoder.encode(TEST_USER_PASSWORD),
                "An",
                "Nguyễn Văn"
        );

        jdbcTemplate.update(
                """
                        INSERT INTO user_roles (user_id, role)
                        VALUES (?, ?)
                        """,
                TEST_USER_ID,
                Role.USER.name()
        );
    }

    private void ensureDefaultDevices(User user) {
        for (DeviceType deviceType : Set.of(DeviceType.FAN, DeviceType.LIGHT)) {
            deviceRepository.findByUser_IdAndDeviceType(user.getId(), deviceType)
                    .orElseGet(() -> deviceRepository.save(Device.builder()
                            .deviceType(deviceType)
                            .intensityLevel(0)
                            .user(user)
                            .build()));
        }
    }

    private void ensureDefaultSensors(User user) {
        for (SensorType sensorType : Set.of(SensorType.HUMIDITY, SensorType.LIGHT, SensorType.TEMPERATURE)) {
            sensorRepository.findByUser_IdAndSensorType(user.getId(), sensorType)
                    .orElseGet(() -> sensorRepository.save(Sensor.builder()
                            .sensorType(sensorType)
                            .user(user)
                            .build()));
        }
    }
}
