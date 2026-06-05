package com.aiot.backend.service;

import com.aiot.backend.dto.iot.GatewayCommandMessage;
import com.aiot.backend.dto.response.CommandResponse;
import com.aiot.backend.entity.Command;
import com.aiot.backend.exception.ErrorCode;
import com.aiot.backend.exception.WebException;
import com.aiot.backend.mapper.CommandMapper;
import com.aiot.backend.repository.CommandRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommandService {
    SimpMessagingTemplate messagingTemplate;

    CommandRepository commandRepository;

    CommandMapper commandMapper;

    ObjectMapper objectMapper;

    public void sendCmdToGateway(Command command) {
        GatewayCommandMessage message = GatewayCommandMessage.builder()
                .userId(command.getUser().getId())
                .deviceType(command.getDevice().getDeviceType())
                .value(command.getCurrentIntensity())
                .build();

        try {
            messagingTemplate.convertAndSend("/topic/commands", objectMapper.writeValueAsString(message));
        } catch (JacksonException e) {
            throw new WebException(ErrorCode.COMMAND_EXECUTION_FAILED);
        }
    }

    public List<CommandResponse> getCommands(String userId) {
        return commandRepository.findByUser_Id(userId).stream().map(
                data -> commandMapper.toResponse(data)
        ).toList();
    }

    public Command getRawCommand(String userId, String commandId) {
        return commandRepository.findByIdAndUser_Id(commandId, userId).orElseThrow(
                () -> new WebException(ErrorCode.COMMAND_NOT_FOUND)
        );
    }

    public CommandResponse getCommand(String userId, String commandId) {
        Command command = getRawCommand(userId, commandId);
        return commandMapper.toResponse(command);
    }

    public void deleteCommand(String userId, String commandId) {
        Command command = getRawCommand(userId, commandId);
        commandRepository.delete(command);
    }

}
