package com.aiot.backend.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Builder(toBuilder = true)
@Getter
@Setter
public class SpeechInputResponse {
    String id;
    String rawtext;
    String predictLabel;
    Double confidence;
    LocalDateTime createdAt;
    DeviceResponse device;
    Integer targetValue;
}
