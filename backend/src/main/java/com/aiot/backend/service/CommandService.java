package com.aiot.backend.service;

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

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommandService {
    SimpMessagingTemplate messagingTemplate;

    CommandRepository commandRepository;

    CommandMapper commandMapper;

    public void sendCmdToGateway(Command command) {
        String payload = String.format(
                "{\"userId\":\"%s\",\"deviceType\":\"%s\",\"value\":%d}",
                command.getUser().getId(),
                command.getDevice().getDeviceType().name(),
                command.getCurrentIntensity()
        );

        messagingTemplate.convertAndSend("/topic/commands", payload);
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
