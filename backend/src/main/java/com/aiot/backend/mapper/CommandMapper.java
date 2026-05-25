package com.aiot.backend.mapper;

import com.aiot.backend.dto.response.CommandResponse;
import com.aiot.backend.entity.Command;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommandMapper {
    DeviceMapper deviceMapper;

    public CommandResponse toResponse(Command command) {
        return CommandResponse.builder()
                .id(command.getId())
                .commandType(command.getCommandType())
                .device(deviceMapper.toResponse(command.getDevice()))
                .previousIntensity(command.getPreviousIntensity())
                .currentIntensity(command.getCurrentIntensity())
                .autoRuleId(command.getAutoRule() == null ? null : command.getAutoRule().getId())
                .speechInputId(command.getSpeechInput() == null ? null : command.getSpeechInput().getId())
                .createdAt(command.getCreatedAt())
                .build();
    }
}
