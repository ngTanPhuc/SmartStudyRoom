package com.aiot.backend.client;

import com.aiot.backend.configuration.AiServiceProperties;
import com.aiot.backend.dto.iot.SpeechInputResult;
import com.aiot.backend.dto.request.SpeechInputRequest;
import com.aiot.backend.exception.ErrorCode;
import com.aiot.backend.exception.WebException;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Component
public class AiPredictionClient {
    private final AiServiceProperties properties;
    private final WebClient webClient;

    public AiPredictionClient(AiServiceProperties properties) {
        this.properties = properties;
        this.webClient = WebClient.builder()
                .baseUrl(properties.getBaseUrl())
                .build();
    }

    public SpeechInputResult predict(SpeechInputRequest request) {
        return webClient.post()
                .uri("/predict")
                .bodyValue(request)
                .retrieve()
                .onStatus(status -> status.is5xxServerError(),
                        res -> Mono.error(new WebException(ErrorCode.ML_SERVICE_UNAVAILABLE)))
                .onStatus(status -> status.is4xxClientError(),
                        res -> Mono.error(new WebException(ErrorCode.ML_BAD_REQUEST)))
                .bodyToMono(SpeechInputResult.class)
                .timeout(Duration.ofSeconds(properties.getTimeoutSeconds()))
                .onErrorMap(ex -> {
                    if (ex instanceof WebException) return ex;
                    return new WebException(ErrorCode.ML_TIMEOUT);
                })
                .block();
    }
}
