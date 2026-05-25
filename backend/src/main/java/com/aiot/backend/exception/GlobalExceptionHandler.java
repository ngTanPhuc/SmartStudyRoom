package com.aiot.backend.exception;

import com.aiot.backend.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(value = RuntimeException.class)
    public ResponseEntity<ApiResponse> handleRuntimeException (RuntimeException runtimeException) {
        return ResponseEntity.<ApiResponse>badRequest().body(
                ApiResponse.builder()
                        .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                        .message(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage())
                        .build()
        );
    }
    @ExceptionHandler(value = WebException.class)
    public ResponseEntity<ApiResponse> handleWebException (WebException webException) {
        return ResponseEntity.status(webException.getErrorCode().getStatus()).body(
                ApiResponse.builder()
                        .code(webException.getErrorCode().getCode())
                        .message(webException.getErrorCode().getMessage())
                        .build()
        );
    }
}
