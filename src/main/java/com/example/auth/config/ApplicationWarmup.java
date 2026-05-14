package com.example.auth.config;

import com.example.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class ApplicationWarmup implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ApplicationWarmup.class);
    private static final String WARMUP_EMAIL = "__warmup__@scenehive.local";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ApplicationWarmup(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        warmupUserLookup();
        warmupPasswordEncoder();
    }

    private void warmupUserLookup() {
        long startedAt = System.nanoTime();
        try {
            userRepository.findByEmail(WARMUP_EMAIL);
            log.info("Application warm-up user lookup completed. elapsedMs={}", elapsedMillis(startedAt));
        } catch (Exception e) {
            log.warn("Application warm-up user lookup failed. elapsedMs={}", elapsedMillis(startedAt), e);
        }
    }

    private void warmupPasswordEncoder() {
        long startedAt = System.nanoTime();
        try {
            passwordEncoder.encode("scenehive-warmup-password");
            log.info("Application warm-up password encoder completed. elapsedMs={}", elapsedMillis(startedAt));
        } catch (Exception e) {
            log.warn("Application warm-up password encoder failed. elapsedMs={}", elapsedMillis(startedAt), e);
        }
    }

    private static long elapsedMillis(long startedAtNanos) {
        return (System.nanoTime() - startedAtNanos) / 1_000_000L;
    }
}
