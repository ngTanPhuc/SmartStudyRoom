package com.aiot.backend.service;

import com.aiot.backend.dto.request.AutoRuleCreationRequest;
import com.aiot.backend.dto.request.AutoRuleUpdateRequest;
import com.aiot.backend.dto.response.AutoRuleResponse;
import com.aiot.backend.entity.*;
import com.aiot.backend.exception.ErrorCode;
import com.aiot.backend.exception.WebException;
import com.aiot.backend.mapper.AutoRuleMapper;
import com.aiot.backend.repository.AutoRuleRepository;
import com.aiot.backend.repository.CommandRepository;
import com.aiot.backend.repository.DeviceRepository;
import com.aiot.backend.repository.SensorDataRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AutoRuleService {
    private static final int DEFAULT_COOLDOWN_SECONDS = 5;

    AutoRuleRepository autoRuleRepository;
    CommandRepository commandRepository;
    AutoRuleMapper autoRuleMapper;
    SensorService sensorService;
    SensorDataRepository sensorDataRepository;
    CommandService commandService;
    DeviceRepository deviceRepository;
    DeviceService deviceService;

    private record TriggerCandidate(
            AutoRule rule,
            Double previousValue,
            Double currentValue,
            LocalDateTime currentTimestamp
    ) {}

    @Transactional
    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    public AutoRuleResponse createAutoRule(String userId, AutoRuleCreationRequest request) {
        validateCreationRequest(request);
        Sensor sensor = sensorService.getRawSensor(userId, request.getSensorId());
        Device device = deviceService.getRawDevice(userId, request.getDeviceId());

        AutoRule autoRule = autoRuleMapper.toEntity(request, sensor, device);
        autoRule.setLastEvaluatedAt(getLatestSensorTimestamp(sensor.getId()));
        autoRuleRepository.save(autoRule);

        return toResponseWithCurrentSensorValue(autoRule);
    }

    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    public List<AutoRuleResponse> getAutoRules(String userId) {
        return autoRuleRepository.findByUser_IdAndDeletedAtIsNull(userId).stream()
                .map(this::toResponseWithCurrentSensorValue)
                .toList();
    }

    public AutoRule getRawAutoRule(String userId, String ruleId) {
        return autoRuleRepository.findByIdAndUser_Id(ruleId, userId).orElseThrow(
                ()->new WebException(ErrorCode.RULE_NOT_FOUND)
        );
    }

    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    public AutoRuleResponse getAutoRule(String userId, String ruleId) {
        AutoRule autoRule = getRawAutoRule(userId, ruleId);
        return toResponseWithCurrentSensorValue(autoRule);
    }

    @Transactional
    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    public AutoRuleResponse updateAutoRule(String userId, String ruleId, AutoRuleUpdateRequest request) {
        validateUpdateRequest(request);
        AutoRule autoRule = getRawAutoRule(userId, ruleId);
        ensureMutable(autoRule);
        boolean shouldResetBaseline = shouldResetBaseline(request, autoRule);

        autoRule = autoRuleMapper.toEntity(request, autoRule);
        if (shouldResetBaseline) {
            autoRule.setLastEvaluatedAt(getLatestSensorTimestamp(autoRule.getSensor().getId()));
        }
        autoRuleRepository.save(autoRule);

        return toResponseWithCurrentSensorValue(autoRule);
    }

    private AutoRuleResponse toResponseWithCurrentSensorValue(AutoRule autoRule) {
        AutoRuleResponse response = autoRuleMapper.toResponse(autoRule);
        sensorDataRepository
                .findTopById_SensorIdOrderById_TimestampDesc(autoRule.getSensor().getId())
                .ifPresent(data -> response.getSensorResponse().setCurrentValue(data.getValue()));
        return response;
    }

    @Transactional
    @PreAuthorize("hasAuthority('SCOPE_ADMIN') or #userId == authentication.name")
    public void deleteAutoRule(String userId, String ruleId) {
        AutoRule autoRule = getRawAutoRule(userId, ruleId);
        ensureMutable(autoRule);
        autoRule.setActive(false);
        autoRule.setDeletedAt(LocalDateTime.now());
        autoRuleRepository.save(autoRule);
    }

    public boolean canTrigger(AutoRule rule, Double previousValue, Double currentValue) {
        if (!Boolean.TRUE.equals(rule.getActive()) || rule.getDeletedAt() != null
                || rule.getOperator() == null || rule.getThresh() == null
                || previousValue == null || currentValue == null) {
            return false;
        }

        if (!crossedIntoCondition(rule, previousValue, currentValue)) {
            return false;
        }

        if (rule.getLastTriggerAt() == null) return true;
        long seconds = Duration.between(
                rule.getLastTriggerAt(),
                LocalDateTime.now()
        ).getSeconds();
        int cooldown = rule.getCoolDownSeconds() == null ? DEFAULT_COOLDOWN_SECONDS : rule.getCoolDownSeconds();
        boolean checkTime = seconds >= cooldown;

        return checkTime;
    }

    private boolean crossedIntoCondition(AutoRule rule, Double previousValue, Double currentValue) {
        Double threshold = rule.getThresh();

        return switch (rule.getOperator()) {
            case GT -> previousValue <= threshold && currentValue > threshold;
            case GE -> previousValue < threshold && currentValue >= threshold;
            case LT -> previousValue >= threshold && currentValue < threshold;
            case LE -> previousValue > threshold && currentValue <= threshold;
            case EQ -> !previousValue.equals(threshold) && currentValue.equals(threshold);
            case NEQ -> previousValue.equals(threshold) && !currentValue.equals(threshold);
        };
    }

    @Transactional
    public void handleSensor() {
        List<AutoRule> rules = autoRuleRepository.findByActiveTrueAndDeletedAtIsNull();
        List<TriggerCandidate> candidates = new ArrayList<>();

        for (AutoRule rule : rules) {
            Sensor sensor = rule.getSensor();
            List<SensorData> sensorDataList = sensorDataRepository.findTop2ById_SensorIdOrderById_TimestampDesc(sensor.getId());
            if (sensorDataList.size() < 2) {
                continue;
            }

            SensorData currentData = sensorDataList.get(0);
            SensorData previousData = sensorDataList.get(1);
            LocalDateTime currentTimestamp = currentData.getId().getTimestamp();
            if (rule.getLastEvaluatedAt() != null && !currentTimestamp.isAfter(rule.getLastEvaluatedAt())) {
                continue;
            }

            Double currentValue = currentData.getValue();
            Double previousValue = previousData.getValue();

            if (canTrigger(rule, previousValue, currentValue)) {
                candidates.add(new TriggerCandidate(
                        rule,
                        previousValue,
                        currentValue,
                        currentTimestamp
                ));
            }
            rule.setLastEvaluatedAt(currentTimestamp);
            autoRuleRepository.save(rule);
        }

        Map<String, List<TriggerCandidate>> candidatesByDevice = candidates.stream()
                .collect(Collectors.groupingBy(candidate -> candidate.rule().getDevice().getId()));

        for (List<TriggerCandidate> deviceCandidates : candidatesByDevice.values()) {
            TriggerCandidate selectedCandidate = selectCandidateForDevice(deviceCandidates);
            executeCandidate(selectedCandidate);
        }
    }

    private TriggerCandidate selectCandidateForDevice(List<TriggerCandidate> candidates) {
        return candidates.stream()
                .max(Comparator
                        .comparing(TriggerCandidate::currentTimestamp)
                        .thenComparing(this::boundaryPriority)
                        .thenComparing(candidate -> candidate.rule().getTargetValue())
                        .thenComparing(candidate -> candidate.rule().getId()))
                .orElseThrow(() -> new IllegalStateException("No auto rule candidate to execute"));
    }

    private double boundaryPriority(TriggerCandidate candidate) {
        boolean rising = candidate.currentValue() >= candidate.previousValue();
        double threshold = candidate.rule().getThresh();
        return rising ? threshold : -threshold;
    }

    private void executeCandidate(TriggerCandidate candidate) {
        AutoRule rule = candidate.rule();
        Device device = rule.getDevice();
        if (Objects.equals(device.getIntensityLevel(), rule.getTargetValue())) {
            return;
        }

        Command command = autoRuleMapper.toCommand(rule);
        commandRepository.save(command);
        deviceRepository.save(command.getDevice());

        commandService.sendCmdToGateway(command);

        rule.setLastTriggerAt(LocalDateTime.now());
        autoRuleRepository.save(rule);
    }

    private void validateCreationRequest(AutoRuleCreationRequest request) {
        if (request == null || request.getSensorId() == null || request.getSensorId().isBlank()
                || request.getDeviceId() == null || request.getDeviceId().isBlank()
                || request.getOperator() == null || request.getThresh() == null
                || request.getTargetValue() == null) {
            throw new WebException(ErrorCode.INVALID_REQUEST);
        }
        validateThreshold(request.getThresh());
    }

    private void validateUpdateRequest(AutoRuleUpdateRequest request) {
        if (request == null || (request.getOperator() == null && request.getThresh() == null
                && request.getTargetValue() == null && request.getActive() == null)) {
            throw new WebException(ErrorCode.INVALID_REQUEST);
        }
        if (request.getThresh() != null) {
            validateThreshold(request.getThresh());
        }
    }

    private void validateThreshold(Double threshold) {
        if (threshold.isNaN() || threshold.isInfinite()) {
            throw new WebException(ErrorCode.RULE_INVALID);
        }
    }

    private void ensureMutable(AutoRule autoRule) {
        if (autoRule.getDeletedAt() != null) {
            throw new WebException(ErrorCode.RULE_NOT_FOUND);
        }
    }

    private boolean shouldResetBaseline(AutoRuleUpdateRequest request, AutoRule autoRule) {
        boolean enablingRule = Boolean.TRUE.equals(request.getActive()) && !Boolean.TRUE.equals(autoRule.getActive());
        boolean operatorChanged = request.getOperator() != null && request.getOperator() != autoRule.getOperator();
        boolean thresholdChanged = request.getThresh() != null
                && Double.compare(request.getThresh(), autoRule.getThresh()) != 0;
        boolean targetChanged = request.getTargetValue() != null
                && !autoRuleMapper
                .normalizeTargetValue(autoRule.getDevice().getDeviceType(), request.getTargetValue())
                .equals(autoRule.getTargetValue());

        return enablingRule || operatorChanged || thresholdChanged || targetChanged;
    }

    private LocalDateTime getLatestSensorTimestamp(String sensorId) {
        return sensorDataRepository
                .findTopById_SensorIdOrderById_TimestampDesc(sensorId)
                .map(data -> data.getId().getTimestamp())
                .orElse(null);
    }
}
