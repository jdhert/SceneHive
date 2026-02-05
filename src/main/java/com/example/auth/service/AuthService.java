package com.example.auth.service;

import com.example.auth.dto.*;
import com.example.auth.entity.User;
import com.example.auth.exception.CustomException;
import com.example.auth.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final EmailService emailService;
    private final RedisService redisService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                      JwtService jwtService, AuthenticationManager authenticationManager,
                      UserDetailsService userDetailsService, EmailService emailService,
                      RedisService redisService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.emailService = emailService;
        this.redisService = redisService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new CustomException("이메일이 이미 존재합니다", HttpStatus.BAD_REQUEST);
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .name(request.name())
                .isVerified(false)
                .build();

        User savedUser = userRepository.save(user);
        
        String verificationCode = generateVerificationCode();
        // Save to Redis with 5 minute expiration
        redisService.setDataExpire(savedUser.getEmail(), verificationCode, 60 * 5L);
        
        emailService.sendVerificationEmail(user.getEmail(), verificationCode);

        return AuthResponse.ofRegister("회원가입 성공. 이메일 인증을 완료해주세요. (유효시간 5분)", savedUser.getId());
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        if (!user.isVerified()) {
            throw new CustomException("이메일 인증이 완료되지 않았습니다.", HttpStatus.FORBIDDEN);
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.email());

        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return AuthResponse.ofLogin(accessToken, refreshToken, jwtService.getAccessTokenExpiration() / 1000);
    }

    @Transactional
    public void verifyEmail(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        if (user.isVerified()) {
            throw new CustomException("이미 인증된 사용자입니다.", HttpStatus.BAD_REQUEST);
        }

        String storedCode = redisService.getData(email);
        
        if (storedCode == null) {
            throw new CustomException("인증 코드가 만료되었습니다. 다시 가입해주세요.", HttpStatus.BAD_REQUEST);
        }

        if (!storedCode.equals(code)) {
            throw new CustomException("인증 코드가 일치하지 않습니다.", HttpStatus.BAD_REQUEST);
        }

        user.setVerified(true);
        userRepository.save(user);
        redisService.deleteData(email);
    }

    private String generateVerificationCode() {
        return String.valueOf((int) (Math.random() * 900000) + 100000); // 6 digit random number
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.refreshToken();

        if (!jwtService.validateToken(refreshToken)) {
            throw new CustomException("유효하지 않은 refresh token입니다", HttpStatus.UNAUTHORIZED);
        }

        String email = jwtService.extractUsername(refreshToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);

        String newAccessToken = jwtService.generateAccessToken(userDetails);

        return AuthResponse.ofRefresh(newAccessToken, jwtService.getAccessTokenExpiration() / 1000);
    }

    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        return UserResponse.from(user);
    }
}
