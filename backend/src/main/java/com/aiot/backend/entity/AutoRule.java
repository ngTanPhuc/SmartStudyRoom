package com.aiot.backend.entity;

import com.aiot.backend.enums.Operator;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AutoRule {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    @Column(nullable = false)
    String description;
    @Column(nullable = false)
    Boolean active;
    @Column(nullable = false)
    Operator operator;
    @Column(nullable = false)
    Double thresh;
    @ManyToOne
    @JoinColumn(name = "user_id")
    User user;
    @ManyToOne
    @JoinColumn(name = "sensor_id")
    Sensor sensor;
    @ManyToOne
    @JoinColumn(name = "device_id")
    Device device;
    @Column(nullable = false)
    Integer targetValue;
    LocalDateTime lastTriggerAt;
    LocalDateTime lastEvaluatedAt;
    Integer coolDownSeconds;
    LocalDateTime deletedAt;
}
