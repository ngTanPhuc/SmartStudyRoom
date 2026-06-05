package com.aiot.backend.service;

import com.aiot.backend.dto.request.AutoRuleCreationRequest;
import com.aiot.backend.dto.request.AutoRuleUpdateRequest;
import com.aiot.backend.entity.AutoRule;
import com.aiot.backend.entity.Command;
import com.aiot.backend.entity.Device;
import com.aiot.backend.entity.Sensor;
import com.aiot.backend.entity.SensorData;
import com.aiot.backend.entity.SensorDataId;
import com.aiot.backend.entity.User;
import com.aiot.backend.enums.DeviceType;
import com.aiot.backend.enums.Operator;
import com.aiot.backend.enums.SensorType;
import com.aiot.backend.exception.WebException;
import com.aiot.backend.mapper.AutoRuleMapper;
import com.aiot.backend.mapper.DeviceMapper;
import com.aiot.backend.mapper.SensorMapper;
import com.aiot.backend.repository.AutoRuleRepository;
import com.aiot.backend.repository.CommandRepository;
import com.aiot.backend.repository.DeviceRepository;
import com.aiot.backend.repository.SensorDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AutoRuleServiceTest {
    private AutoRuleRepository autoRuleRepository;
    private CommandRepository commandRepository;
    private SensorDataRepository sensorDataRepository;
    private CommandService commandService;
    private DeviceRepository deviceRepository;
    private SensorService sensorService;
    private DeviceService deviceService;
    private AutoRuleMapper autoRuleMapper;
    private AutoRuleService autoRuleService;

    private User user;
    private Sensor temperatureSensor;
    private Device fan;

    @BeforeEach
    void setUp() {
        autoRuleRepository = mock(AutoRuleRepository.class);
        commandRepository = mock(CommandRepository.class);
        sensorDataRepository = mock(SensorDataRepository.class);
        commandService = mock(CommandService.class);
        deviceRepository = mock(DeviceRepository.class);
        sensorService = mock(SensorService.class);
        deviceService = mock(DeviceService.class);
        autoRuleMapper = new AutoRuleMapper(new SensorMapper(), new DeviceMapper());
        autoRuleService = new AutoRuleService(
                autoRuleRepository,
                commandRepository,
                autoRuleMapper,
                sensorService,
                sensorDataRepository,
                commandService,
                deviceRepository,
                deviceService
        );

        user = User.builder().id("user-1").email("user@example.com").password("password").build();
        temperatureSensor = Sensor.builder()
                .id("sensor-temp")
                .sensorType(SensorType.TEMPERATURE)
                .user(user)
                .build();
        fan = Device.builder()
                .id("device-fan")
                .deviceType(DeviceType.FAN)
                .intensityLevel(0)
                .user(user)
                .build();
    }

    @ParameterizedTest
    @CsvSource({
            "GT,10,10,11,true",
            "GT,10,11,12,false",
            "GE,10,9,10,true",
            "LT,10,10,9,true",
            "LT,10,9,8,false",
            "LE,10,11,10,true",
            "EQ,10,9,10,true",
            "EQ,10,10,10,false",
            "NEQ,10,10,11,true",
            "NEQ,10,9,11,false"
    })
    void canTriggerOnlyWhenSensorCrossesIntoCondition(
            Operator operator,
            double threshold,
            double previousValue,
            double currentValue,
            boolean expected
    ) {
        AutoRule rule = activeRule(operator, threshold, fan, 100);

        assertEquals(expected, autoRuleService.canTrigger(rule, previousValue, currentValue));
    }

    @Test
    void cooldownSuppressesCrossingAndDoesNotQueueIt() {
        AutoRule rule = activeRule(Operator.GT, 10, fan, 100);
        rule.setLastTriggerAt(LocalDateTime.now().minusSeconds(1));
        rule.setCoolDownSeconds(5);

        assertFalse(autoRuleService.canTrigger(rule, 10.0, 11.0));
    }

    @Test
    void createRuleBaselinesLatestSensorTimestampAndNormalizesTarget() throws Exception {
        LocalDateTime latestTimestamp = LocalDateTime.of(2026, 6, 5, 10, 0);
        SensorData latestData = sensorData(temperatureSensor, latestTimestamp, 35.0);
        Device light = Device.builder()
                .id("device-light")
                .deviceType(DeviceType.LIGHT)
                .intensityLevel(0)
                .user(user)
                .build();

        when(sensorService.getRawSensor("user-1", "sensor-temp")).thenReturn(temperatureSensor);
        when(deviceService.getRawDevice("user-1", "device-light")).thenReturn(light);
        when(sensorDataRepository.findTopById_SensorIdOrderById_TimestampDesc("sensor-temp"))
                .thenReturn(Optional.of(latestData));

        AutoRuleCreationRequest request = creationRequest(
                "sensor-temp",
                "device-light",
                Operator.GT,
                30.0,
                50
        );

        autoRuleService.createAutoRule("user-1", request);

        AutoRule savedRule = captureSavedRule();
        assertEquals(latestTimestamp, savedRule.getLastEvaluatedAt());
        assertEquals(100, savedRule.getTargetValue());
    }

    @Test
    void newRuleDoesNotReplayCrossingThatAlreadyHappened() throws Exception {
        LocalDateTime previousTimestamp = LocalDateTime.of(2026, 6, 5, 10, 0);
        LocalDateTime currentTimestamp = previousTimestamp.plusSeconds(5);
        SensorData previousData = sensorData(temperatureSensor, previousTimestamp, 25.0);
        SensorData currentData = sensorData(temperatureSensor, currentTimestamp, 35.0);

        when(sensorService.getRawSensor("user-1", "sensor-temp")).thenReturn(temperatureSensor);
        when(deviceService.getRawDevice("user-1", "device-fan")).thenReturn(fan);
        when(sensorDataRepository.findTopById_SensorIdOrderById_TimestampDesc("sensor-temp"))
                .thenReturn(Optional.of(currentData));

        AutoRuleCreationRequest request = creationRequest(
                "sensor-temp",
                "device-fan",
                Operator.GT,
                30.0,
                100
        );
        autoRuleService.createAutoRule("user-1", request);
        AutoRule savedRule = captureSavedRule();

        when(autoRuleRepository.findByActiveTrueAndDeletedAtIsNull()).thenReturn(List.of(savedRule));
        when(sensorDataRepository.findTop2ById_SensorIdOrderById_TimestampDesc("sensor-temp"))
                .thenReturn(List.of(currentData, previousData));

        autoRuleService.handleSensor();

        verify(commandRepository, never()).save(any(Command.class));
        verify(commandService, never()).sendCmdToGateway(any(Command.class));
    }

    @Test
    void updateRuleBaselinesWhenReEnabledOrDefinitionChanged() throws Exception {
        LocalDateTime latestTimestamp = LocalDateTime.of(2026, 6, 5, 10, 0);
        AutoRule rule = activeRule(Operator.GT, 30, fan, 100);
        rule.setId("rule-1");
        rule.setActive(false);
        rule.setLastEvaluatedAt(latestTimestamp.minusMinutes(1));

        when(autoRuleRepository.findByIdAndUser_Id("rule-1", "user-1")).thenReturn(Optional.of(rule));
        when(sensorDataRepository.findTopById_SensorIdOrderById_TimestampDesc("sensor-temp"))
                .thenReturn(Optional.of(sensorData(temperatureSensor, latestTimestamp, 32.0)));

        AutoRuleUpdateRequest request = updateRequest(null, null, null, true);

        autoRuleService.updateAutoRule("user-1", "rule-1", request);

        AutoRule savedRule = captureSavedRule();
        assertTrue(savedRule.getActive());
        assertEquals(latestTimestamp, savedRule.getLastEvaluatedAt());
        assertEquals(null, savedRule.getLastTriggerAt());
    }

    @Test
    void deleteRuleSoftDeletesAndPreservesCommandHistory() {
        AutoRule rule = activeRule(Operator.GT, 30, fan, 100);
        rule.setId("rule-1");

        when(autoRuleRepository.findByIdAndUser_Id("rule-1", "user-1")).thenReturn(Optional.of(rule));

        autoRuleService.deleteAutoRule("user-1", "rule-1");

        assertFalse(rule.getActive());
        assertNotNull(rule.getDeletedAt());
        verify(autoRuleRepository).save(rule);
        verify(commandRepository, never()).deleteByAutoRuleId(anyString());
    }

    @Test
    void deletedRuleCannotBeUpdated() throws Exception {
        AutoRule rule = activeRule(Operator.GT, 30, fan, 100);
        rule.setId("rule-1");
        rule.setDeletedAt(LocalDateTime.now());

        when(autoRuleRepository.findByIdAndUser_Id("rule-1", "user-1")).thenReturn(Optional.of(rule));

        assertThrows(
                WebException.class,
                () -> autoRuleService.updateAutoRule("user-1", "rule-1", updateRequest(null, 25.0, null, null))
        );
    }

    @Test
    void schedulerTriggersOneCommandForCrossing() {
        LocalDateTime previousTimestamp = LocalDateTime.of(2026, 6, 5, 10, 0);
        LocalDateTime currentTimestamp = previousTimestamp.plusSeconds(5);
        AutoRule rule = activeRule(Operator.GT, 30, fan, 100);

        when(autoRuleRepository.findByActiveTrueAndDeletedAtIsNull()).thenReturn(List.of(rule));
        when(sensorDataRepository.findTop2ById_SensorIdOrderById_TimestampDesc("sensor-temp"))
                .thenReturn(List.of(
                        sensorData(temperatureSensor, currentTimestamp, 31.0),
                        sensorData(temperatureSensor, previousTimestamp, 29.0)
                ));

        autoRuleService.handleSensor();

        Command command = captureSavedCommand();
        assertEquals(0, command.getPreviousIntensity());
        assertEquals(100, command.getCurrentIntensity());
        verify(commandService).sendCmdToGateway(command);
    }

    @Test
    void schedulerDoesNotCreateCommandWhenDeviceAlreadyAtTarget() {
        LocalDateTime previousTimestamp = LocalDateTime.of(2026, 6, 5, 10, 0);
        LocalDateTime currentTimestamp = previousTimestamp.plusSeconds(5);
        fan.setIntensityLevel(100);
        AutoRule rule = activeRule(Operator.GT, 30, fan, 100);

        when(autoRuleRepository.findByActiveTrueAndDeletedAtIsNull()).thenReturn(List.of(rule));
        when(sensorDataRepository.findTop2ById_SensorIdOrderById_TimestampDesc("sensor-temp"))
                .thenReturn(List.of(
                        sensorData(temperatureSensor, currentTimestamp, 31.0),
                        sensorData(temperatureSensor, previousTimestamp, 29.0)
                ));

        autoRuleService.handleSensor();

        verify(commandRepository, never()).save(any(Command.class));
        verify(commandService, never()).sendCmdToGateway(any(Command.class));
    }

    @Test
    void schedulerChoosesDeterministicWinnerForSameDevice() {
        LocalDateTime previousTimestamp = LocalDateTime.of(2026, 6, 5, 10, 0);
        LocalDateTime currentTimestamp = previousTimestamp.plusSeconds(5);
        AutoRule lowerThresholdRule = activeRule(Operator.GT, 30, fan, 33);
        lowerThresholdRule.setId("rule-low");
        AutoRule higherThresholdRule = activeRule(Operator.GT, 40, fan, 66);
        higherThresholdRule.setId("rule-high");

        when(autoRuleRepository.findByActiveTrueAndDeletedAtIsNull())
                .thenReturn(List.of(lowerThresholdRule, higherThresholdRule));
        when(sensorDataRepository.findTop2ById_SensorIdOrderById_TimestampDesc(eq("sensor-temp")))
                .thenReturn(List.of(
                        sensorData(temperatureSensor, currentTimestamp, 45.0),
                        sensorData(temperatureSensor, previousTimestamp, 25.0)
                ));

        autoRuleService.handleSensor();

        Command command = captureSavedCommand();
        assertEquals(66, command.getCurrentIntensity());
    }

    @Test
    void autoRuleUserEndpointsRequireOwnerOrAdmin() throws Exception {
        String expected = "hasAuthority('SCOPE_ADMIN') or #userId == authentication.name";

        assertPreAuthorize(expected, "createAutoRule", String.class, AutoRuleCreationRequest.class);
        assertPreAuthorize(expected, "getAutoRules", String.class);
        assertPreAuthorize(expected, "getAutoRule", String.class, String.class);
        assertPreAuthorize(expected, "updateAutoRule", String.class, String.class, AutoRuleUpdateRequest.class);
        assertPreAuthorize(expected, "deleteAutoRule", String.class, String.class);
        assertEquals(null, AutoRuleService.class.getMethod("handleSensor").getAnnotation(PreAuthorize.class));
    }

    private AutoRule activeRule(Operator operator, double threshold, Device device, int targetValue) {
        return AutoRule.builder()
                .id("rule-" + operator + "-" + targetValue)
                .active(true)
                .operator(operator)
                .thresh(threshold)
                .sensor(temperatureSensor)
                .device(device)
                .user(user)
                .targetValue(targetValue)
                .coolDownSeconds(5)
                .build();
    }

    private SensorData sensorData(Sensor sensor, LocalDateTime timestamp, double value) {
        return SensorData.builder()
                .id(SensorDataId.builder()
                        .sensorId(sensor.getId())
                        .timestamp(timestamp)
                        .build())
                .value(value)
                .build();
    }

    private AutoRuleCreationRequest creationRequest(
            String sensorId,
            String deviceId,
            Operator operator,
            Double threshold,
            Integer targetValue
    ) throws Exception {
        AutoRuleCreationRequest request = new AutoRuleCreationRequest();
        setField(request, "sensorId", sensorId);
        setField(request, "deviceId", deviceId);
        setField(request, "operator", operator);
        setField(request, "thresh", threshold);
        setField(request, "targetValue", targetValue);
        return request;
    }

    private AutoRuleUpdateRequest updateRequest(
            Operator operator,
            Double threshold,
            Integer targetValue,
            Boolean active
    ) throws Exception {
        AutoRuleUpdateRequest request = new AutoRuleUpdateRequest();
        setField(request, "operator", operator);
        setField(request, "thresh", threshold);
        setField(request, "targetValue", targetValue);
        setField(request, "active", active);
        return request;
    }

    private void setField(Object target, String name, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
    }

    private AutoRule captureSavedRule() {
        var captor = org.mockito.ArgumentCaptor.forClass(AutoRule.class);
        verify(autoRuleRepository).save(captor.capture());
        return captor.getValue();
    }

    private Command captureSavedCommand() {
        var captor = org.mockito.ArgumentCaptor.forClass(Command.class);
        verify(commandRepository).save(captor.capture());
        return captor.getValue();
    }

    private void assertPreAuthorize(String expected, String methodName, Class<?>... parameterTypes) throws Exception {
        Method method = AutoRuleService.class.getMethod(methodName, parameterTypes);
        PreAuthorize preAuthorize = method.getAnnotation(PreAuthorize.class);
        assertNotNull(preAuthorize);
        assertEquals(expected, preAuthorize.value());
    }
}
