package com.aiot.backend.dto.request;

import com.aiot.backend.enums.Operator;
import lombok.Getter;

@Getter
public class AutoRuleUpdateRequest {
    Operator operator;
    Double thresh;
    Integer targetValue;
    Boolean active;
}
