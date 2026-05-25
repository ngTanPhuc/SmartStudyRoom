package com.aiot.backend.entity;

import com.aiot.backend.enums.SensorType;
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
        @UniqueConstraint(name = "uk_sensor_user_type", columnNames = {"user_id", "sensor_type"})
})
public class Sensor {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    @Enumerated(EnumType.STRING)
    @Column(name = "sensor_type", nullable = false)
    SensorType sensorType;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    User user;
}
