package com.aiot.backend.exception;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;
@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WebException extends RuntimeException{
    ErrorCode errorCode;
    public WebException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
