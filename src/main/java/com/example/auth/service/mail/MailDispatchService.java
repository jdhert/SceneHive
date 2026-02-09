package com.example.auth.service.mail;

import com.example.auth.config.MailAsyncProperties;
import com.example.auth.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.RejectedExecutionException;

@Service
public class MailDispatchService {

    private static final Logger log = LoggerFactory.getLogger(MailDispatchService.class);

    private final TaskExecutor mailExecutor;
    private final EmailService emailService;
    private final MailRetryQueueService retryQueueService;
    private final MailAsyncProperties mailAsyncProperties;

    public MailDispatchService(@Qualifier("mailExecutor") TaskExecutor mailExecutor,
                               EmailService emailService,
                               MailRetryQueueService retryQueueService,
                               MailAsyncProperties mailAsyncProperties) {
        this.mailExecutor = mailExecutor;
        this.emailService = emailService;
        this.retryQueueService = retryQueueService;
        this.mailAsyncProperties = mailAsyncProperties;
    }

    public void sendVerificationEmail(String to, String code) {
        dispatchAsync(MailTask.verification(to, code));
    }

    public void sendAccountUnlockEmail(String to, String token) {
        dispatchAsync(MailTask.accountUnlock(to, token));
    }

    public void sendPasswordResetEmail(String to, String token) {
        dispatchAsync(MailTask.passwordReset(to, token));
    }

    private void dispatchAsync(MailTask task) {
        try {
            mailExecutor.execute(() -> sendNow(task));
        } catch (RejectedExecutionException ex) {
            log.error("Mail executor rejected task. to={}, type={}", task.getTo(), task.getType(), ex);
            enqueueRetry(task, task.getAttempt() + 1);
        }
    }

    private void sendNow(MailTask task) {
        try {
            switch (task.getType()) {
                case VERIFICATION -> emailService.sendVerificationEmail(task.getTo(), task.getPayload());
                case ACCOUNT_UNLOCK -> emailService.sendAccountUnlockEmail(task.getTo(), task.getPayload());
                case PASSWORD_RESET -> emailService.sendPasswordResetEmail(task.getTo(), task.getPayload());
                default -> log.warn("Unknown mail type. to={}, type={}", task.getTo(), task.getType());
            }
        } catch (Exception ex) {
            log.warn("Mail send failed. to={}, type={}, attempt={}", task.getTo(), task.getType(), task.getAttempt(), ex);
            enqueueRetry(task, task.getAttempt() + 1);
        }
    }

    private void enqueueRetry(MailTask task, int nextAttempt) {
        MailAsyncProperties.Retry retry = mailAsyncProperties.getRetry();
        if (nextAttempt > retry.getMaxAttempts()) {
            log.error("Mail retry attempts exceeded. to={}, type={}, attempt={}", task.getTo(), task.getType(), nextAttempt);
            return;
        }

        long delaySeconds = computeBackoffSeconds(retry, nextAttempt);
        MailTask retryTask = new MailTask(task.getType(), task.getTo(), task.getPayload(), nextAttempt);
        retryQueueService.enqueue(retryTask, delaySeconds);
    }

    private long computeBackoffSeconds(MailAsyncProperties.Retry retry, int attempt) {
        double delay = retry.getInitialDelaySeconds() * Math.pow(retry.getBackoffMultiplier(), Math.max(0, attempt - 1));
        long capped = Math.min((long) delay, retry.getMaxDelaySeconds());
        return Math.max(1, capped);
    }

    @Scheduled(fixedDelayString = "${app.async.mail.retry.poll-interval-ms:3000}")
    public void processRetryQueue() {
        int batchSize = mailAsyncProperties.getRetry().getBatchSize();
        List<MailTask> tasks = retryQueueService.popDueTasks(batchSize);
        for (MailTask task : tasks) {
            sendNow(task);
        }
    }
}
