package com.aiot.backend.mapper;

import com.aiot.backend.dto.request.SpeechInputRequest;
import com.aiot.backend.dto.response.SpeechInputResponse;
import com.aiot.backend.entity.SpeechInput;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SpeechInputMapper {
    DeviceMapper deviceMapper;

    public SpeechInput toEntity(SpeechInputRequest request) {
        return SpeechInput.builder()
                .rawText(request.getRawtext())
                .build();
    }
    public SpeechInputResponse toResponse(SpeechInput speechInput) {
        return SpeechInputResponse.builder()
                .id(speechInput.getId())
                .rawtext(speechInput.getRawText())
                .predictLabel(speechInput.getPredictLabel())
                .confidence(speechInput.getConfidence())
                .createdAt(speechInput.getCreatedAt())
                .device(speechInput.getDevice() == null ? null : deviceMapper.toResponse(speechInput.getDevice()))
                .targetValue(speechInput.getTargetValue())
                .build();
    }
}
