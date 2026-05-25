package com.aiot.backend.configuration;

import java.nio.charset.StandardCharsets;
import javax.crypto.spec.SecretKeySpec;

import jakarta.annotation.PostConstruct;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

@Component
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CustomJwtDecoder implements JwtDecoder {
    @NonFinal
    @Value("${jwt.signerKey}")
    String signerKey;

    @NonFinal
    NimbusJwtDecoder jwtDecoder;

    @PostConstruct
    void init() {
        SecretKeySpec key = new SecretKeySpec(
                signerKey.getBytes(StandardCharsets.UTF_8),
                "HmacSHA512"
        );
        jwtDecoder = NimbusJwtDecoder.withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS512)
                .build();
    }

    @Override
    public Jwt decode(String token) throws JwtException {
        // optional: custom check
        // authenticationService.introspect(token);

        return jwtDecoder.decode(token);
    }
}
