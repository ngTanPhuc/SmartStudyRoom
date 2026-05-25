package com.aiot.backend.controller;

import com.aiot.backend.dto.request.SpeechInputRequest;
import com.aiot.backend.dto.response.ApiResponse;
import com.aiot.backend.dto.response.SpeechInputResponse;
import com.aiot.backend.service.SpeechInputService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("users/{userId}/speech-inputs")
public class SpeechInputController {
    SpeechInputService speechInputService;
    @GetMapping
    public ApiResponse<List<SpeechInputResponse>> getSpeechInputs(@PathVariable("userId") String userId) {
        List<SpeechInputResponse> response = speechInputService.getSpeechInputs(userId);
        return ApiResponse.<List<SpeechInputResponse>>builder()
                .result(response)
                .build();
    }

    @GetMapping("/{speechInputId}")
    public ApiResponse<SpeechInputResponse> getSpeechInput(@PathVariable("userId") String userId,
                                                 @PathVariable("speechInputId") String speechInputId) {
        SpeechInputResponse response = speechInputService.getSpeechInput(userId, speechInputId);
        return ApiResponse.<SpeechInputResponse>builder()
                .result(response)
                .build();
    }

    @DeleteMapping("/{speechInputId}")
    public ApiResponse deleteSpeechInput(@PathVariable("userId") String userId,
                                         @PathVariable("speechInputId") String speechInputId) {
        speechInputService.deleteSpeechInput(userId, speechInputId);
        return ApiResponse.builder().build();
    }

    @PostMapping("/predict")
    public ApiResponse<SpeechInputResponse> controlDevice(@PathVariable("userId") String userId,
                                                          @RequestBody SpeechInputRequest request) {
        SpeechInputResponse response = speechInputService.processSpeechInput(userId, request);
        return ApiResponse.<SpeechInputResponse>builder()
                .result(response)
                .build();
    }
}
