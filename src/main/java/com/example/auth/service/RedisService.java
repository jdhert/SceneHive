package com.example.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RedisService {

    private final StringRedisTemplate stringRedisTemplate;

    public void setDataExpire(String key, String value, long duration) {
        Duration expireDuration = Duration.ofSeconds(duration);
        stringRedisTemplate.opsForValue().set(key, value, expireDuration);
    }

    public String getData(String key) {
        return stringRedisTemplate.opsForValue().get(key);
    }

    public void deleteData(String key) {
        stringRedisTemplate.delete(key);
    }
}
