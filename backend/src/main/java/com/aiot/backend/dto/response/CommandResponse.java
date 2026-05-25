package com.aiot.backend.dto.response;

import com.aiot.backend.enums.CommandType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Builder(toBuilder = true)
@Getter
@Setter
public class CommandResponse {
    String id;
    CommandType commandType;
    DeviceResponse device;
    Integer previousIntensity;
    Integer currentIntensity;
    String autoRuleId;
    String speechInputId;
    LocalDateTime createdAt;
}
