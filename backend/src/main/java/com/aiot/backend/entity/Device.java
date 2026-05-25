package com.aiot.backend.entity;

import com.aiot.backend.enums.DeviceType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(uniqueConstraints = {
        @UniqueConstraint(name = "uk_device_user_type", columnNames = {"user_id", "device_type"})
})
public class Device {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", nullable = false)
    DeviceType deviceType;
    @Column(nullable = false)
    Integer intensityLevel;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    User user;
}
