package com.example.auth.config;

import com.example.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;

@Component
public class ApplicationWarmup implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ApplicationWarmup.class);
    private static final String WARMUP_EMAIL = "__warmup__@scenehive.local";

    private final DataSource dataSource;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean warmupEnabled;

    public ApplicationWarmup(DataSource dataSource,
                             UserRepository userRepository,
                             PasswordEncoder passwordEncoder,
                             @Value("${app.warmup.enabled:true}") boolean warmupEnabled) {
        this.dataSource = dataSource;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.warmupEnabled = warmupEnabled;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!warmupEnabled) {
            log.info("Application warm-up disabled.");
            return;
        }

        warmupDataSourceConnection("startup", true);
        warmupUserLookup("startup", true);
        warmupPasswordEncoder();
    }

    @Scheduled(
            fixedDelayString = "${app.warmup.interval-ms:300000}",
            initialDelayString = "${app.warmup.initial-delay-ms:60000}"
    )
    public void keepDatabaseWarm() {
        if (!warmupEnabled) {
            return;
        }

        warmupDataSourceConnection("scheduled", false);
        warmupUserLookup("scheduled", false);
    }

    private void warmupDataSourceConnection(String source, boolean visibleLog) {
        long startedAt = System.nanoTime();
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement("SELECT 1")) {
            statement.execute();
            logSuccess(visibleLog, "Application warm-up datasource connection completed. source={}, elapsedMs={}",
                    source, elapsedMillis(startedAt));
        } catch (Exception e) {
            log.warn("Application warm-up datasource connection failed. source={}, elapsedMs={}",
                    source, elapsedMillis(startedAt), e);
        }
    }

    private void warmupUserLookup(String source, boolean visibleLog) {
        long startedAt = System.nanoTime();
        try {
            userRepository.findByEmail(WARMUP_EMAIL);
            logSuccess(visibleLog, "Application warm-up user lookup completed. source={}, elapsedMs={}",
                    source, elapsedMillis(startedAt));
        } catch (Exception e) {
            log.warn("Application warm-up user lookup failed. source={}, elapsedMs={}",
                    source, elapsedMillis(startedAt), e);
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

    private void logSuccess(boolean visibleLog, String message, Object... args) {
        if (visibleLog) {
            log.info(message, args);
            return;
        }

        log.debug(message, args);
    }

    private static long elapsedMillis(long startedAtNanos) {
        return (System.nanoTime() - startedAtNanos) / 1_000_000L;
    }
}
