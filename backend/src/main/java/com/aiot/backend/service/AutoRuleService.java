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
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AutoRuleService {
    AutoRuleRepository autoRuleRepository;
    CommandRepository commandRepository;
    AutoRuleMapper autoRuleMapper;
    SensorService sensorService;
    SensorDataRepository sensorDataRepository;
    CommandService commandService;
    DeviceRepository deviceRepository;
    DeviceService deviceService;

    @Transactional
    public AutoRuleResponse createAutoRule(String userId, AutoRuleCreationRequest request) {
        if (request.getSensorId() == null || request.getDeviceId() == null
                || request.getOperator() == null || request.getThresh() == null
                || request.getTargetValue() == null) {
            throw new WebException(ErrorCode.INVALID_REQUEST);
        }
        Sensor sensor = sensorService.getRawSensor(userId, request.getSensorId());
        Device device = deviceService.getRawDevice(userId, request.getDeviceId());

        AutoRule autoRule = autoRuleMapper.toEntity(request, sensor, device);
        autoRuleRepository.save(autoRule);

        return autoRuleMapper.toResponse(autoRule);
    }

    public List<AutoRuleResponse> getAutoRules(String userId) {
        return autoRuleRepository.findByUser_Id(userId).stream().map(
                data -> autoRuleMapper.toResponse(data)
        ).toList();
    }

    public AutoRule getRawAutoRule(String userId, String ruleId) {
        return autoRuleRepository.findByIdAndUser_Id(ruleId, userId).orElseThrow(
                ()->new WebException(ErrorCode.RULE_NOT_FOUND)
        );
    }

    public AutoRuleResponse getAutoRule(String userId, String ruleId) {
        AutoRule autoRule = getRawAutoRule(userId, ruleId);
        return autoRuleMapper.toResponse(autoRule);
    }

    @Transactional
    public AutoRuleResponse updateAutoRule(String userId, String ruleId, AutoRuleUpdateRequest request) {
        AutoRule autoRule = getRawAutoRule(userId, ruleId);

        autoRule = autoRuleMapper.toEntity(request, autoRule);
        autoRuleRepository.save(autoRule);

        return autoRuleMapper.toResponse(autoRule);
    }

    public void deleteAutoRule(String userId, String ruleId) {
        AutoRule autoRule = getRawAutoRule(userId, ruleId);
        autoRuleRepository.delete(autoRule);
    }

    public boolean canTrigger(AutoRule rule, Double value) {
        if (!Boolean.TRUE.equals(rule.getActive()) || value == null) {
            return false;
        }

        boolean checkData = switch (rule.getOperator()) {
            case GT  -> value > rule.getThresh();
            case LT  -> value < rule.getThresh();
            case GE -> value >= rule.getThresh();
            case LE -> value <= rule.getThresh();
            case EQ  -> value.equals(rule.getThresh());
            case NEQ -> !value.equals(rule.getThresh());
        };

        if (!checkData) {
            return false;
        }
        if (rule.getLastTriggerAt() == null) return true;
        long seconds = Duration.between(
                rule.getLastTriggerAt(),
                LocalDateTime.now()
        ).getSeconds();
        int cooldown = rule.getCoolDownSeconds() == null ? 5 : rule.getCoolDownSeconds();
        boolean checkTime = seconds >= cooldown;

        return checkTime;
    }

    @Transactional
    public void handleSensor() {
        List<AutoRule> rules = autoRuleRepository.findByActiveTrue();

        for (AutoRule rule : rules) {
            Sensor sensor = rule.getSensor();
            List<SensorData> sensorDataList = sensorDataRepository.findTop2ById_SensorIdOrderById_TimestampDesc(sensor.getId());
            if (sensorDataList.isEmpty()) {
                continue;
            }
            Double value = sensorDataList.get(0).getValue();
            if (canTrigger(rule, value)) {
                Command command = autoRuleMapper.toCommand(rule);
                commandRepository.save(command);
                deviceRepository.save(command.getDevice());

                commandService.sendCmdToGateway(command);

                rule.setLastTriggerAt(LocalDateTime.now());
                autoRuleRepository.save(rule);
            }
        }
    }
}
