package com.aiot.backend.controller;

import com.aiot.backend.dto.request.AutoRuleCreationRequest;
import com.aiot.backend.dto.request.AutoRuleUpdateRequest;
import com.aiot.backend.dto.response.ApiResponse;
import com.aiot.backend.dto.response.AutoRuleResponse;
import com.aiot.backend.service.AutoRuleService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("users/{userId}/auto-rules")
public class AutoRuleController {
    AutoRuleService autoRuleService;
    @GetMapping
    public ApiResponse<List<AutoRuleResponse>> getAutoRules(@PathVariable("userId") String userId) {
        List<AutoRuleResponse> response = autoRuleService.getAutoRules(userId);
        return ApiResponse.<List<AutoRuleResponse>>builder()
                .result(response)
                .build();
    }

    @PostMapping
    public ApiResponse<AutoRuleResponse> createAutoRule(@PathVariable("userId") String userId,
                                                        @RequestBody AutoRuleCreationRequest request) {
        AutoRuleResponse response = autoRuleService.createAutoRule(userId, request);
        return ApiResponse.<AutoRuleResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/{autoRuleId}")
    public ApiResponse<AutoRuleResponse> getAutoRule(@PathVariable("userId") String userId,
                                                   @PathVariable("autoRuleId") String autoRuleId) {
        AutoRuleResponse response = autoRuleService.getAutoRule(userId, autoRuleId);
        return ApiResponse.<AutoRuleResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/{autoRuleId}")
    public ApiResponse<AutoRuleResponse> updateAutoRule(@PathVariable("userId") String userId,
                                                        @PathVariable("autoRuleId") String autoRuleId,
                                                        @RequestBody AutoRuleUpdateRequest request) {
        AutoRuleResponse response = autoRuleService.updateAutoRule(userId, autoRuleId, request);
        return ApiResponse.<AutoRuleResponse>builder()
                .result(response)
                .build();
    }

    @DeleteMapping("/{autoRuleId}")
    public ApiResponse deleteAutoRule(@PathVariable("userId") String userId,
                                     @PathVariable("autoRuleId") String autoRuleId) {
        autoRuleService.deleteAutoRule(userId, autoRuleId);
        return ApiResponse.builder().build();
    }
}
