package com.aiot.backend.mapper;

import com.aiot.backend.dto.request.AutoRuleCreationRequest;
import com.aiot.backend.dto.request.AutoRuleUpdateRequest;
import com.aiot.backend.dto.response.AutoRuleResponse;
import com.aiot.backend.entity.AutoRule;
import com.aiot.backend.entity.Command;
import com.aiot.backend.entity.Device;
import com.aiot.backend.entity.Sensor;
import com.aiot.backend.enums.CommandType;
import com.aiot.backend.enums.Operator;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AutoRuleMapper {
    SensorMapper sensorMapper;
    DeviceMapper deviceMapper;

    public AutoRule toEntity(AutoRuleCreationRequest request,
                             Sensor sensor, Device device) {
        AutoRule autoRule = AutoRule.builder()
                .active(true)
                .operator(request.getOperator())
                .thresh(request.getThresh())
                .user(sensor.getUser())
                .sensor(sensor)
                .device(device)
                .targetValue(request.getTargetValue())
                .lastTriggerAt(null)
                .coolDownSeconds(5)
                .build();
        autoRule.setDescription(buildDescription(autoRule));
        return autoRule;
    }
    private String mapOperator(Operator op) {
        return switch (op) {
            case GT  -> ">";
            case LT  -> "<";
            case EQ  -> "=";
            case GE -> ">=";
            case LE -> "<=";
            case NEQ -> "!=";
        };
    }
    private String buildDescription(AutoRule rule) {
        String sensorName = rule.getSensor().getSensorType().name();
        String deviceName = rule.getDevice().getDeviceType().name();
        String op = mapOperator(rule.getOperator());
        return String.format(
                "Set %s to %d when %s %s %.0f",
                deviceName,
                rule.getTargetValue(),
                sensorName,
                op,
                rule.getThresh()
        );
    }
    public AutoRule toEntity(AutoRuleUpdateRequest request, AutoRule autoRule) {
        if (request.getOperator() != null) autoRule.setOperator(request.getOperator());
        if (request.getActive() != null) {
            autoRule.setActive(request.getActive());
            if (request.getActive()) autoRule.setLastTriggerAt(null);
        }
        if (request.getThresh() != null) autoRule.setThresh(request.getThresh());
        if (request.getTargetValue() != null) autoRule.setTargetValue(request.getTargetValue());
        autoRule.setDescription(buildDescription(autoRule));
        return autoRule;
    }
    public AutoRuleResponse toResponse(AutoRule autoRule) {
        return AutoRuleResponse.builder()
                .id(autoRule.getId())
                .description(autoRule.getDescription())
                .active(autoRule.getActive())
                .operator(autoRule.getOperator())
                .thresh(autoRule.getThresh())
                .sensorResponse(sensorMapper.toResponse(autoRule.getSensor()))
                .deviceResponse(deviceMapper.toResponse(autoRule.getDevice()))
                .targetValue(autoRule.getTargetValue())
                .build();
    }

    public Command toCommand(AutoRule autoRule) {
        Device device = autoRule.getDevice();
        Integer oldValue = device.getIntensityLevel();
        Integer newValue = autoRule.getTargetValue();
        device.setIntensityLevel(newValue);
        return Command.builder()
                .commandType(CommandType.AUTO_RULE)
                .previousIntensity(oldValue)
                .currentIntensity(newValue)
                .device(device)
                .user(autoRule.getUser())
                .autoRule(autoRule)
                .build();
    }
}
