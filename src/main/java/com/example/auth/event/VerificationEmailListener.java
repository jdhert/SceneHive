package com.example.auth.event;

import com.example.auth.service.RedisService;
import com.example.auth.service.mail.MailDispatchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.concurrent.ThreadLocalRandom;

@Component
public class VerificationEmailListener {

    private static final Logger log = LoggerFactory.getLogger(VerificationEmailListener.class);
    private static final long VERIFICATION_CODE_TTL_SECONDS = 60 * 5L;

    private final RedisService redisService;
    private final MailDispatchService mailDispatchService;

    public VerificationEmailListener(RedisService redisService, MailDispatchService mailDispatchService) {
        this.redisService = redisService;
        this.mailDispatchService = mailDispatchService;
    }

    @Async("taskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onVerificationEmailRequested(VerificationEmailRequestedEvent event) {
        long startedAt = System.nanoTime();

        try {
            String verificationCode = generateVerificationCode();
            redisService.setDataExpire(event.email(), verificationCode, VERIFICATION_CODE_TTL_SECONDS);
            mailDispatchService.sendVerificationEmail(event.email(), verificationCode);
            log.info(
                    "Verification email dispatch requested. email={}, userId={}, elapsedMs={}",
                    maskEmail(event.email()),
                    event.userId(),
                    elapsedMillis(startedAt)
            );
        } catch (Exception e) {
            log.warn("Failed to request verification email dispatch. email={}, userId={}", maskEmail(event.email()), event.userId(), e);
        }
    }

    private String generateVerificationCode() {
        return String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
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
