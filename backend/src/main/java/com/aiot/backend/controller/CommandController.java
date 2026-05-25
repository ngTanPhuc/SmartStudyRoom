package com.aiot.backend.controller;

import com.aiot.backend.dto.response.ApiResponse;
import com.aiot.backend.dto.response.CommandResponse;
import com.aiot.backend.service.CommandService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("users/{userId}/commands")
public class CommandController {
    CommandService commandService;

    @GetMapping
    public ApiResponse<List<CommandResponse>> getCommands(@PathVariable("userId") String userId) {
        List<CommandResponse> response = commandService.getCommands(userId);
        return ApiResponse.<List<CommandResponse>>builder()
                .result(response)
                .build();
    }

    @GetMapping("/{commandId}")
    public ApiResponse<CommandResponse> getCommand(@PathVariable("userId") String userId,
                                                 @PathVariable("commandId") String commandId) {
        CommandResponse response = commandService.getCommand(userId, commandId);
        return ApiResponse.<CommandResponse>builder()
                .result(response)
                .build();
    }

    @DeleteMapping("/{commandId}")
    public ApiResponse deleteCommand(@PathVariable("userId") String userId,
                                     @PathVariable("commandId") String commandId) {
        commandService.deleteCommand(userId, commandId);
        return ApiResponse.builder().build();
    }
}
