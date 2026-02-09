package com.example.auth.service.mail;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class MailRetryQueueService {

    private static final Logger log = LoggerFactory.getLogger(MailRetryQueueService.class);
    private static final String RETRY_ZSET_KEY = "mail:retry:zset";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public MailRetryQueueService(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public void enqueue(MailTask task, long delaySeconds) {
        long score = System.currentTimeMillis() + (delaySeconds * 1000L);
        try {
            String json = objectMapper.writeValueAsString(task);
            redisTemplate.opsForZSet().add(RETRY_ZSET_KEY, json, score);
        } catch (Exception e) {
            log.error("Failed to enqueue mail retry task. to={}, type={}, attempt={}", task.getTo(), task.getType(), task.getAttempt(), e);
        }
    }

    public List<MailTask> popDueTasks(int maxCount) {
        long now = System.currentTimeMillis();
        Set<String> items = redisTemplate.opsForZSet()
                .rangeByScore(RETRY_ZSET_KEY, 0, now, 0, maxCount);
        if (items == null || items.isEmpty()) {
            return List.of();
        }

        List<MailTask> tasks = new ArrayList<>(items.size());
        for (String item : items) {
            Long removed = redisTemplate.opsForZSet().remove(RETRY_ZSET_KEY, item);
            if (removed == null || removed == 0) {
                continue;
            }

            try {
                MailTask task = objectMapper.readValue(item, MailTask.class);
                tasks.add(task);
            } catch (Exception e) {
                log.error("Failed to parse mail retry task payload. payload={}", item, e);
            }
        }

        return tasks;
    }
}
