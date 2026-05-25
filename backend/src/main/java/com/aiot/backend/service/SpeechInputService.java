package com.aiot.backend.service;

import com.aiot.backend.dto.IotEdge.SpeechInputResult;
import com.aiot.backend.dto.request.SpeechInputRequest;
import com.aiot.backend.dto.response.SpeechInputResponse;
import com.aiot.backend.entity.Command;
import com.aiot.backend.entity.Device;
import com.aiot.backend.entity.SpeechInput;
import com.aiot.backend.entity.User;
import com.aiot.backend.enums.CommandType;
import com.aiot.backend.enums.DeviceType;
import com.aiot.backend.exception.ErrorCode;
import com.aiot.backend.exception.WebException;
import com.aiot.backend.mapper.SpeechInputMapper;
import com.aiot.backend.repository.CommandRepository;
import com.aiot.backend.repository.DeviceRepository;
import com.aiot.backend.repository.SpeechInputRepository;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SpeechInputService {
    CommandRepository commandRepository;
    CommandService commandService;
    SpeechInputRepository speechInputRepository;
    SpeechInputMapper speechInputMapper;
    DeviceRepository deviceRepository;
    UserService userService;

    WebClient webClient;

    public SpeechInputService(CommandRepository commandRepository, CommandService commandService, SpeechInputRepository speechInputRepository,
                              SpeechInputMapper speechInputMapper, DeviceRepository deviceRepository, UserService userService) {
        this.commandRepository = commandRepository;
        this.commandService = commandService;
        this.speechInputRepository = speechInputRepository;
        this.speechInputMapper = speechInputMapper;
        this.deviceRepository = deviceRepository;
        this.userService = userService;
        this.webClient = WebClient.builder()
                .baseUrl("http://localhost:8000")
                .build();
    }

    public List<SpeechInputResponse> getSpeechInputs(String userId) {
        List<SpeechInput> speechInputs = speechInputRepository.findByUser_Id(userId);
        return speechInputs.stream().map(
                data -> speechInputMapper.toResponse(data)
        ).toList();
    }

    public SpeechInput getRawSpeechInput(String userId, String speechInputId) {
        return speechInputRepository.findByIdAndUser_Id(speechInputId, userId).orElseThrow(
                ()->new WebException(ErrorCode.SPEECH_INPUT_NOT_FOUND)
        );
    }

    public SpeechInputResponse getSpeechInput(String userId, String speechInputId) {
        SpeechInput speechInput = getRawSpeechInput(userId, speechInputId);
        return speechInputMapper.toResponse(speechInput);
    }

    public void deleteSpeechInput(String userId, String speechInputId) {
        SpeechInput speechInput = getRawSpeechInput(userId, speechInputId);
        speechInputRepository.delete(speechInput);
    }

    public SpeechInputResponse processSpeechInput(String userId, SpeechInputRequest request) {
        if (request.getRawtext() == null || request.getRawtext().isBlank()) {
            throw new WebException(ErrorCode.SPEECH_INPUT_INVALID);
        }
        SpeechInputResult result = predict(request);
        if (result == null || result.getPredictLabel() == null) {
            throw new WebException(ErrorCode.ML_RESPONSE_INVALID);
        }

        Intent intent = parseIntent(result.getPredictLabel());
        if (intent == null) {
            throw new WebException(ErrorCode.ML_LOW_CONFIDENCE);
        }

        User user = userService.getRawUser(userId);
        Device device = deviceRepository.findByUser_IdAndDeviceType(userId, intent.deviceType()).orElseThrow(
                () -> new WebException(ErrorCode.DEVICE_NOT_FOUND)
        );

        int oldValue = device.getIntensityLevel();
        int targetValue = resolveTargetValue(intent, oldValue);

        SpeechInput speechInput = speechInputMapper.toEntity(request);
        speechInput.setConfidence(result.getConfidence());
        speechInput.setPredictLabel(result.getPredictLabel());
        speechInput.setUser(user);
        speechInput.setDevice(device);
        speechInput.setTargetValue(targetValue);
        speechInputRepository.save(speechInput);

        device.setIntensityLevel(targetValue);
        deviceRepository.save(device);

        Command command = Command.builder()
                .commandType(CommandType.SPEECH)
                .device(device)
                .previousIntensity(oldValue)
                .currentIntensity(targetValue)
                .user(user)
                .speechInput(speechInput)
                .build();
        commandRepository.save(command);

        commandService.sendCmdToGateway(command);

        return speechInputMapper.toResponse(speechInput);
    }

    private Intent parseIntent(String label) {
        String normalized = label.trim().toUpperCase();
        if ("UNKNOWN".equals(normalized)) {
            return null;
        }

        return switch (normalized) {
            case "TURN_ON_FAN", "FAN_ON" -> new Intent(DeviceType.FAN, SpeechAction.ON);
            case "TURN_OFF_FAN", "FAN_OFF" -> new Intent(DeviceType.FAN, SpeechAction.OFF);
            case "TURN_ON_LIGHT", "LIGHT_ON", "TURN_ON_LED", "LED_ON" -> new Intent(DeviceType.LIGHT, SpeechAction.ON);
            case "TURN_OFF_LIGHT", "LIGHT_OFF", "TURN_OFF_LED", "LED_OFF" -> new Intent(DeviceType.LIGHT, SpeechAction.OFF);
            case "INCREASE_FAN", "FAN_INCREASE" -> new Intent(DeviceType.FAN, SpeechAction.INCREASE);
            case "DECREASE_FAN", "FAN_DECREASE" -> new Intent(DeviceType.FAN, SpeechAction.DECREASE);
            case "INCREASE_LIGHT", "LIGHT_INCREASE" -> new Intent(DeviceType.LIGHT, SpeechAction.INCREASE);
            case "DECREASE_LIGHT", "LIGHT_DECREASE" -> new Intent(DeviceType.LIGHT, SpeechAction.DECREASE);
            default -> null;
        };
    }

    private int resolveTargetValue(Intent intent, int oldValue) {
        return switch (intent.action()) {
            case ON -> 100;
            case OFF -> 0;
            case INCREASE -> Math.min(100, oldValue + 10);
            case DECREASE -> Math.max(0, oldValue - 10);
        };
    }

    public SpeechInputResult predict(SpeechInputRequest request) {
        SpeechInputResult result = webClient.post()
                .uri("/predict")
                .bodyValue(request)
                .retrieve()
                .onStatus(status -> status.is5xxServerError(),
                        res -> Mono.error(new WebException(ErrorCode.ML_SERVICE_UNAVAILABLE)))
                .onStatus(status -> status.is4xxClientError(),
                        res -> Mono.error(new WebException(ErrorCode.ML_BAD_REQUEST)))
                .bodyToMono(SpeechInputResult.class)
                .timeout(Duration.ofSeconds(2))
                .onErrorMap(ex -> {
                    if (ex instanceof WebException) return ex;
                    return new WebException(ErrorCode.ML_TIMEOUT);
                })
                .block();
        return result;
    }

    private record Intent(DeviceType deviceType, SpeechAction action) {}

    private enum SpeechAction {
        ON,
        OFF,
        INCREASE,
        DECREASE
    }
}
