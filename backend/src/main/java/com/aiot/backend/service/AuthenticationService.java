package com.aiot.backend.service;

import com.aiot.backend.dto.request.AuthenticationRequest;
import com.aiot.backend.dto.request.IntrospectRequest;
import com.aiot.backend.dto.request.LogoutRequest;
import com.aiot.backend.dto.request.RefreshTokenRequest;
import com.aiot.backend.dto.response.AuthenticationResponse;
import com.aiot.backend.dto.response.IntrospectResponse;
import com.aiot.backend.entity.InvalidatedToken;
import com.aiot.backend.entity.User;
import com.aiot.backend.exception.ErrorCode;
import com.aiot.backend.exception.WebException;
import com.aiot.backend.repository.InvalidatedTokenRepository;
import com.aiot.backend.repository.UserRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.AccessLevel;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.text.ParseException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Optional;
import java.util.StringJoiner;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
    @NonFinal
    @Value("${jwt.signerKey}")
    String SIGNED_KEY;

    @NonFinal
    @Value("${jwt.valid-duration}")
    long VALID_DURATION;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    long REFRESHABLE_DURATION;

    PasswordEncoder passwordEncoder;

    UserRepository userRepository;

    InvalidatedTokenRepository invalidatedTokenRepository;

    // LOG-IN
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        User user = userRepository.findByEmail(request.getIdentifier())
                .or(() -> userRepository.findByPhone(request.getIdentifier()))
                .orElseThrow(() -> new WebException(ErrorCode.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword()))
            throw new WebException(ErrorCode.UNAUTHORIZED);

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String accessToken  = generateToken(user);
        return AuthenticationResponse.builder()
                .token(accessToken )
                .build();
    }

    private String generateToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        Instant now = Instant.now();
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getId())
                .issuer("auth-service")
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusSeconds(VALID_DURATION)))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", buildScope(user))
                .build();
        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);
        try {
            jwsObject.sign(new MACSigner(SIGNED_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            throw new WebException(ErrorCode.CANNOT_SIGN_JWT);
        }
    }

    private String buildScope(User user) {
        StringJoiner stringJoiner = new StringJoiner(" ");
        if (!CollectionUtils.isEmpty(user.getRoles()))
            user.getRoles().forEach(stringJoiner::add);
        return stringJoiner.toString();
    }

    // LOG-OUT
    public void logout(LogoutRequest request)
            throws ParseException, JOSEException {
        var signedToken = verifyToken(request.getToken(), false);

        String jti = signedToken.getJWTClaimsSet().getJWTID();
        Date expiry = signedToken.getJWTClaimsSet().getExpirationTime();

        if (jti == null) {
            throw new RuntimeException("Token missing jti");
        }

        if (!invalidatedTokenRepository.existsById(jti)) {
            InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                    .id(jti)
                    .expiryTime(expiry)
                    .build();

            invalidatedTokenRepository.save(invalidatedToken);
        }

    }

    private SignedJWT verifyToken(String token, boolean isRefresh)
            throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNED_KEY.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);
        if (!signedJWT.verify(verifier)) {
            throw new WebException(ErrorCode.UNAUTHORIZED);
        }

        var claims = signedJWT.getJWTClaimsSet();
        Date expiryTime;
        if (isRefresh) {
            Date issueTime = claims.getIssueTime();
            if (issueTime == null) {
                throw new WebException(ErrorCode.UNAUTHORIZED);
            }
            expiryTime = new Date(
                    issueTime.toInstant()
                            .plusSeconds(REFRESHABLE_DURATION)
                            .toEpochMilli()
            );
        } else {
            expiryTime = claims.getExpirationTime();
        }

        if (expiryTime == null || expiryTime.before(new Date())) {
            throw new WebException(ErrorCode.UNAUTHORIZED);
        }


        String jti = claims.getJWTID();
        if (jti == null || invalidatedTokenRepository.existsById(jti)) {
            throw new WebException(ErrorCode.UNAUTHORIZED);
        }

        return signedJWT;
    }

    // VERIFY
    public IntrospectResponse introspect(IntrospectRequest request)
            throws JOSEException, ParseException {
        String token = request.getToken();
        boolean isValid = true;

        try {
            verifyToken(token, false);
        } catch (WebException e) {
            isValid = false;
        }

        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }

    // REFRESH TOKEN
    public AuthenticationResponse refreshToken(RefreshTokenRequest request)
            throws ParseException, JOSEException{
        SignedJWT signToken = verifyToken(request.getToken(), true);

        InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                .id(signToken.getJWTClaimsSet().getJWTID())
                .expiryTime(signToken.getJWTClaimsSet().getExpirationTime())
                .build();
        invalidatedTokenRepository.save(invalidatedToken);

        String userId = signToken.getJWTClaimsSet().getSubject();
        User user = userRepository.findById(userId).orElseThrow(
                () -> new WebException(ErrorCode.UNAUTHORIZED)
        );

        String token = generateToken(user);
        return AuthenticationResponse.builder()
                .token(token)
                .build();
    }
}
