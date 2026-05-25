package com.aiot.backend.entity;

import com.aiot.backend.enums.CommandType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Command {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    CommandType commandType;
    @ManyToOne
    @JoinColumn(name = "device_id")
    Device device;
    @Column(nullable = false)
    Integer previousIntensity;
    @Column(nullable = false)
    Integer currentIntensity;
    @ManyToOne
    @JoinColumn(name = "user_id")
    User user;
    @ManyToOne
    @JoinColumn(name = "speech_input_id")
    SpeechInput speechInput;
    @ManyToOne
    @JoinColumn(name = "auto_rule_id")
    AutoRule autoRule;
    @CreationTimestamp
    LocalDateTime createdAt;
}
