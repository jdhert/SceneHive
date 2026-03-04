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
import com.example.auth.exception.CustomException;
import com.example.auth.repository.UserRepository;
import com.example.auth.service.mail.MailDispatchService;
import org.springframework.http.HttpStatus;
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

    private static final int MAX_FAILED_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final MailDispatchService mailDispatchService;
    private final RedisService redisService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                      JwtService jwtService, AuthenticationManager authenticationManager,
                      UserDetailsService userDetailsService, MailDispatchService mailDispatchService,
                      RedisService redisService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.mailDispatchService = mailDispatchService;
        this.redisService = redisService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new CustomException("이미 존재하는 이메일입니다.", HttpStatus.BAD_REQUEST);
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .name(request.name())
                .provider(AuthProvider.LOCAL)
                .isVerified(false)
                .build();

        User savedUser = userRepository.save(user);

        String verificationCode = generateVerificationCode();
        redisService.setDataExpire(savedUser.getEmail(), verificationCode, 60 * 5L);

        mailDispatchService.sendVerificationEmail(user.getEmail(), verificationCode);

        return AuthResponse.ofRegister("회원가입 성공. 이메일 인증을 완료해주세요. (유효시간 5분)", savedUser.getId());
    }

    @Transactional(noRollbackFor = CustomException.class)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
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
                            request.email(),
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

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.email());

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

    private String generateVerificationCode() {
        return String.valueOf((int) (Math.random() * 900000) + 100000);
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
}
