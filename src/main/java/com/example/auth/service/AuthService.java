package com.example.auth.service;

import com.example.auth.dto.AuthResponse;
import com.example.auth.dto.LoginRequest;
import com.example.auth.dto.PasswordResetRequest;
import com.example.auth.dto.RefreshTokenRequest;
import com.example.auth.dto.RegisterRequest;
import com.example.auth.dto.ResetPasswordRequest;
import com.example.auth.dto.UserResponse;
import com.example.auth.entity.AuthProvider;
import com.example.auth.entity.User;
import com.example.auth.event.VerificationEmailRequestedEvent;
import com.example.auth.exception.CustomException;
import com.example.auth.repository.UserRepository;
import com.example.auth.service.mail.MailDispatchService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final int MAX_FAILED_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final MailDispatchService mailDispatchService;
    private final RedisService redisService;
    private final ApplicationEventPublisher eventPublisher;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                      JwtService jwtService, AuthenticationManager authenticationManager,
                      UserDetailsService userDetailsService, MailDispatchService mailDispatchService,
                      RedisService redisService, ApplicationEventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.mailDispatchService = mailDispatchService;
        this.redisService = redisService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        long startedAt = System.nanoTime();
        String email = normalizeEmail(request.email());
        String maskedEmail = maskEmail(email);
        String name = request.name().trim();

        long lookupStartedAt = System.nanoTime();
        User existingUser = userRepository.findByEmail(email).orElse(null);
        log.info("Register user lookup completed. email={}, elapsedMs={}", maskedEmail, elapsedMillis(lookupStartedAt));
        if (existingUser != null) {
            if (!existingUser.isVerified()) {
                long verificationStartedAt = System.nanoTime();
                requestVerificationEmail(existingUser);
                log.info(
                        "Register verification email requested for unverified user. email={}, requestElapsedMs={}, totalElapsedMs={}",
                        maskedEmail,
                        elapsedMillis(verificationStartedAt),
                        elapsedMillis(startedAt)
                );
                return AuthResponse.ofRegister(
                        "이미 가입된 이메일입니다. 이메일 인증 코드를 다시 발송했습니다. (유효시간 5분)",
                        existingUser.getId()
                );
            }

            log.info("Register rejected for existing verified user. email={}, totalElapsedMs={}", maskedEmail, elapsedMillis(startedAt));
            throw new CustomException("이미 존재하는 이메일입니다.", HttpStatus.BAD_REQUEST);
        }

        long passwordEncodeStartedAt = System.nanoTime();
        String encodedPassword = passwordEncoder.encode(request.password());
        log.info("Register password encoded. email={}, elapsedMs={}", maskedEmail, elapsedMillis(passwordEncodeStartedAt));

        User user = User.builder()
                .email(email)
                .password(encodedPassword)
                .name(name)
                .provider(AuthProvider.LOCAL)
                .isVerified(false)
                .build();

        User savedUser;
        try {
            long saveStartedAt = System.nanoTime();
            savedUser = userRepository.saveAndFlush(user);
            log.info("Register user saved. email={}, userId={}, elapsedMs={}", maskedEmail, savedUser.getId(), elapsedMillis(saveStartedAt));
        } catch (DataIntegrityViolationException e) {
            log.info("Register failed by data integrity violation. email={}, totalElapsedMs={}", maskedEmail, elapsedMillis(startedAt));
            throw new CustomException("이미 존재하는 이메일입니다.", HttpStatus.BAD_REQUEST);
        }

        long verificationStartedAt = System.nanoTime();
        requestVerificationEmail(savedUser);
        log.info(
                "Register verification email requested. email={}, userId={}, requestElapsedMs={}, totalElapsedMs={}",
                maskedEmail,
                savedUser.getId(),
                elapsedMillis(verificationStartedAt),
                elapsedMillis(startedAt)
        );

        return AuthResponse.ofRegister("회원가입 성공. 이메일 인증을 완료해주세요. (유효시간 5분)", savedUser.getId());
    }

    @Transactional(noRollbackFor = CustomException.class)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        if (user.getProvider() != AuthProvider.LOCAL) {
            throw new CustomException("소셜 로그인 계정입니다. " + user.getProvider().name() + " 로그인을 사용해주세요.", HttpStatus.BAD_REQUEST);
        }

        if (user.getAccountLockedUntil() != null) {
            throw new CustomException("계정이 잠겼습니다. 이메일로 전송된 잠금 해제 링크를 확인해주세요.", HttpStatus.LOCKED);
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            email,
                            request.password()
                    )
            );
        } catch (Exception e) {
            int newFailedAttempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(newFailedAttempts);

            if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
                user.setAccountLockedUntil(LocalDateTime.now());
                userRepository.save(user);
                sendAccountUnlockEmail(user);

                throw new CustomException(
                        "비밀번호를 " + MAX_FAILED_ATTEMPTS + "회 잘못 입력하여 계정이 잠겼습니다. 이메일로 전송된 잠금 해제 링크를 확인해주세요.",
                        HttpStatus.LOCKED
                );
            }

            userRepository.save(user);
            int remaining = MAX_FAILED_ATTEMPTS - newFailedAttempts;
            throw new CustomException(
                    "비밀번호가 일치하지 않습니다. (남은 시도 횟수: " + remaining + ")",
                    HttpStatus.UNAUTHORIZED
            );
        }

        if (!user.isVerified()) {
            throw new CustomException("이메일 인증이 완료되지 않았습니다.", HttpStatus.FORBIDDEN);
        }

        if (user.getFailedLoginAttempts() > 0) {
            user.setFailedLoginAttempts(0);
            user.setAccountLockedUntil(null);
            userRepository.save(user);
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);

        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return AuthResponse.ofLogin(accessToken, refreshToken, jwtService.getAccessTokenExpiration() / 1000);
    }

    private void sendAccountUnlockEmail(User user) {
        String unlockToken = UUID.randomUUID().toString();
        String redisKey = "account-unlock:" + unlockToken;
        redisService.setDataExpire(redisKey, user.getEmail(), 60 * 60L);
        mailDispatchService.sendAccountUnlockEmail(user.getEmail(), unlockToken);
    }

    public void resendUnlockEmail(String email) {
        email = normalizeEmail(email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        if (user.getAccountLockedUntil() == null) {
            throw new CustomException("잠긴 계정이 아닙니다.", HttpStatus.BAD_REQUEST);
        }

        sendAccountUnlockEmail(user);
    }

    @Transactional
    public void unlockAccount(String token) {
        String redisKey = "account-unlock:" + token;
        String email = redisService.getData(redisKey);

        if (email == null) {
            throw new CustomException("유효하지 않거나 만료된 토큰입니다.", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        user.setFailedLoginAttempts(0);
        user.setAccountLockedUntil(null);
        userRepository.save(user);

        redisService.deleteData(redisKey);
    }

    @Transactional
    public void verifyEmail(String email, String code) {
        email = normalizeEmail(email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        if (user.isVerified()) {
            throw new CustomException("이미 인증된 사용자입니다.", HttpStatus.BAD_REQUEST);
        }

        String storedCode = redisService.getData(email);

        if (storedCode == null) {
            throw new CustomException("인증 코드가 만료되었습니다. 다시 요청해주세요.", HttpStatus.BAD_REQUEST);
        }

        if (!storedCode.equals(code)) {
            throw new CustomException("인증 코드가 일치하지 않습니다.", HttpStatus.BAD_REQUEST);
        }

        user.setVerified(true);
        userRepository.save(user);
        redisService.deleteData(email);
    }

    private void requestVerificationEmail(User user) {
        eventPublisher.publishEvent(new VerificationEmailRequestedEvent(user.getId(), user.getEmail()));
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new CustomException("유효하지 않은 refresh token입니다.", HttpStatus.UNAUTHORIZED);
        }

        if (!jwtService.validateToken(refreshToken)) {
            throw new CustomException("유효하지 않은 refresh token입니다.", HttpStatus.UNAUTHORIZED);
        }

        String email = jwtService.extractUsername(refreshToken);

        // 비밀번호 변경 이후 발급된 토큰인지 검증
        String pwdChangedKey = "user:pwd-changed:" + email;
        String pwdChangedAt = redisService.getData(pwdChangedKey);
        if (pwdChangedAt != null) {
            long tokenIssuedAt = jwtService.extractIssuedAt(refreshToken).getTime();
            long changedAt = Long.parseLong(pwdChangedAt);
            if (tokenIssuedAt <= changedAt) {
                throw new CustomException("비밀번호가 변경되어 다시 로그인이 필요합니다.", HttpStatus.UNAUTHORIZED);
            }
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String newAccessToken = jwtService.generateAccessToken(userDetails);

        return AuthResponse.ofRefresh(newAccessToken, jwtService.getAccessTokenExpiration() / 1000);
    }

    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        return UserResponse.from(user);
    }

    public void requestPasswordReset(String email) {
        email = normalizeEmail(email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("해당 이메일로 가입된 사용자가 없습니다.", HttpStatus.NOT_FOUND));

        String resetToken = UUID.randomUUID().toString();
        String redisKey = "password-reset:" + resetToken;
        redisService.setDataExpire(redisKey, email, 60 * 15L);

        mailDispatchService.sendPasswordResetEmail(email, resetToken);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        String redisKey = "password-reset:" + token;
        String email = redisService.getData(redisKey);

        if (email == null) {
            throw new CustomException("유효하지 않거나 만료된 토큰입니다.", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        redisService.deleteData(redisKey);
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private static long elapsedMillis(long startedAtNanos) {
        return (System.nanoTime() - startedAtNanos) / 1_000_000L;
    }

    private static String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return "<blank>";
        }

        int atIndex = email.indexOf('@');
        if (atIndex <= 1) {
            return "***" + (atIndex >= 0 ? email.substring(atIndex) : "");
        }

        return email.charAt(0) + "***" + email.substring(atIndex);
    }
}
