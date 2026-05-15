package com.dispatchiq.backend.idempotency;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RedisOrInMemoryIdempotencyService implements IdempotencyService {

    private static final Duration TTL = Duration.ofHours(24);

    private final StringRedisTemplate redisTemplate;
    private final ConcurrentHashMap<String, String> fallback = new ConcurrentHashMap<>();

    @Autowired(required = false)
    public RedisOrInMemoryIdempotencyService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public boolean acquire(String key) {
        if (key == null || key.isBlank()) return false;
        if (redisTemplate != null) {
            Boolean set = redisTemplate.opsForValue().setIfAbsent(key, "locked", TTL);
            return Boolean.TRUE.equals(set);
        }
        return fallback.putIfAbsent(key, "locked") == null;
    }
}
