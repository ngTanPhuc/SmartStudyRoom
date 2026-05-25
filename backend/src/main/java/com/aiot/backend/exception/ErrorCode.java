package com.aiot.backend.exception;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public enum ErrorCode {
    // ===== COMMON (Lỗi chung hệ thống) =====
    UNCATEGORIZED_EXCEPTION(1000, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    // Lỗi không xác định, fallback cuối cùng (catch Exception)

    INVALID_REQUEST(1001, "Invalid request", HttpStatus.BAD_REQUEST),
    // Request sai format, thiếu field, sai kiểu dữ liệu (DTO validation fail)

    UNAUTHORIZED(1002, "Unauthorized", HttpStatus.UNAUTHORIZED),
    // Chưa login / token không hợp lệ

    FORBIDDEN(1003, "Forbidden", HttpStatus.FORBIDDEN),
    // Có quyền truy cập nhưng không đủ quyền (role)

    RESOURCE_NOT_FOUND(1004, "Resource not found", HttpStatus.NOT_FOUND),
    // Dùng chung khi không muốn tạo riêng từng entity

    METHOD_NOT_ALLOWED(1005, "Method not allowed", HttpStatus.METHOD_NOT_ALLOWED),
    // Gọi sai HTTP method (GET vs POST)

    CONFLICT(1006, "Resource conflict", HttpStatus.CONFLICT),
    // Xung đột dữ liệu (duplicate, state conflict)

    // ===== AUTH / JWT =====

    INVALID_TOKEN(1100, "Invalid token", HttpStatus.UNAUTHORIZED),
    // Token sai format / signature

    EXPIRED_TOKEN(1101, "Token expired", HttpStatus.UNAUTHORIZED),
    // Token hết hạn

    REFRESH_TOKEN_INVALID(1102, "Invalid refresh token", HttpStatus.UNAUTHORIZED),
    // Refresh token sai / đã revoke

    CANNOT_SIGN_JWT(1103, "Cannot sign JWT", HttpStatus.INTERNAL_SERVER_ERROR),
    // Lỗi khi tạo JWT (key sai, lib lỗi...)

    // ===== USER =====

    USER_NOT_FOUND(2000, "User not found", HttpStatus.NOT_FOUND),
    // Không tìm thấy user theo id/email

    EMAIL_ALREADY_EXISTS(2001, "Email already exists", HttpStatus.CONFLICT),
    // Email bị trùng khi đăng ký

    PHONE_ALREADY_EXISTS(2002, "Phone already exists", HttpStatus.CONFLICT),
    // Phone bị trùng

    INVALID_PASSWORD(2003, "Invalid password", HttpStatus.BAD_REQUEST),
    // Password sai (login / đổi mật khẩu)

    PASSWORD_TOO_WEAK(2004, "Password too weak", HttpStatus.BAD_REQUEST),
    // Password không đủ tiêu chuẩn

    USER_DISABLED(2005, "User is disabled", HttpStatus.FORBIDDEN),
    // User bị khóa

    // ===== SENSOR =====

    SENSOR_NOT_FOUND(3000, "Sensor not found", HttpStatus.NOT_FOUND),
    // Không tìm thấy sensor

    SENSOR_DATA_NOT_FOUND(3001, "Sensor data not found", HttpStatus.NOT_FOUND),
    // Không có data

    SENSOR_NAME_ALREADY_EXISTS(3002, "Sensor name already exists", HttpStatus.CONFLICT),
    // Trùng tên sensor trong cùng user

    SENSOR_TYPE_ALREADY_EXISTS(3003, "Sensor already exists for this type", HttpStatus.CONFLICT),
    // Một user chỉ có 1 sensor cho mỗi loại (business rule)

    SENSOR_NOT_BELONG_TO_USER(3004, "Sensor does not belong to user", HttpStatus.FORBIDDEN),
    // Truy cập sensor của người khác

    // ===== DEVICE =====

    DEVICE_NOT_FOUND(4000, "Device not found", HttpStatus.NOT_FOUND),
    // Không tìm thấy device

    DEVICE_OFFLINE(4001, "Device is offline", HttpStatus.BAD_REQUEST),
    // Device không kết nối

    DEVICE_NAME_ALREADY_EXISTS(4002, "Device name already exists", HttpStatus.CONFLICT),
    // Trùng tên device

    DEVICE_NOT_BELONG_TO_USER(4003, "Device does not belong to user", HttpStatus.FORBIDDEN),
    // Truy cập device người khác

    DEVICE_COMMUNICATION_FAILED(4004, "Failed to communicate with device", HttpStatus.BAD_GATEWAY),
    // Gửi lệnh xuống device thất bại (IoT layer)

    // ===== COMMAND =====

    COMMAND_NOT_FOUND(5000, "Command not found", HttpStatus.NOT_FOUND),
    // Không tìm thấy command

    COMMAND_INVALID(5001, "Invalid command", HttpStatus.BAD_REQUEST),
    // Command không hợp lệ (ví dụ: tăng quạt nhưng device không support)

    COMMAND_EXECUTION_FAILED(5002, "Command execution failed", HttpStatus.INTERNAL_SERVER_ERROR),
    // Gửi command nhưng fail

    // ===== AUTO RULE =====

    RULE_NOT_FOUND(6000, "Rule not found", HttpStatus.NOT_FOUND),
    // Không tìm thấy rule

    RULE_INVALID(6001, "Invalid rule", HttpStatus.BAD_REQUEST),
    // Rule sai logic (threshold, operator...)

    RULE_NAME_ALREADY_EXISTS(6002, "Rule name already exists", HttpStatus.CONFLICT),
    // Trùng tên rule

    RULE_CONDITION_INVALID(6003, "Rule condition invalid", HttpStatus.BAD_REQUEST),
    // Điều kiện rule không hợp lệ

    // ===== SPEECH INPUT / ML =====

    SPEECH_INPUT_NOT_FOUND(7000, "Speech input not found", HttpStatus.NOT_FOUND),
    // Không tìm thấy input

    SPEECH_INPUT_INVALID(7001, "Invalid speech input", HttpStatus.BAD_REQUEST),
    // Text rác / không parse được

    ML_TIMEOUT(7002, "NLP service timeout", HttpStatus.GATEWAY_TIMEOUT),
    // Gọi FastAPI bị timeout

    ML_SERVICE_UNAVAILABLE(7003, "ML service unavailable", HttpStatus.SERVICE_UNAVAILABLE),
    // Service down

    ML_BAD_REQUEST(7004, "Invalid request to ML service", HttpStatus.BAD_REQUEST),
    // Gửi request sai format sang ML

    ML_RESPONSE_INVALID(7005, "Invalid response from ML service", HttpStatus.BAD_GATEWAY),
    // ML trả về format sai

    ML_LOW_CONFIDENCE(7006, "Prediction confidence too low", HttpStatus.BAD_REQUEST),
    // Confidence < threshold → reject

    ML_PREDICTION_FAILED(7007, "Failed to get prediction", HttpStatus.INTERNAL_SERVER_ERROR),
    // Lỗi khi predict

    // ===== DATABASE =====

    DATABASE_ERROR(8000, "Database error", HttpStatus.INTERNAL_SERVER_ERROR),
    // Lỗi chung DB

    DATA_INTEGRITY_VIOLATION(8001, "Data integrity violation", HttpStatus.CONFLICT),
    // Vi phạm unique / foreign key

    ;

    int code;
    String message;
    HttpStatus status;
}