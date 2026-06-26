package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.response.TelemetryUpdateResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class DriverLocationService {

    private static final Duration LOCATION_TTL = Duration.ofMinutes(5);
    private static final String KEY_PREFIX = "telemetry:driver:";

    private final StringRedisTemplate redisTemplate;

    @Autowired
    public DriverLocationService(@Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void persistLocation(String driverId, double lat, double lng) {
        if (redisTemplate == null) {
            return;
        }
        String payload = String.format("{\"lat\":%.6f,\"lng\":%.6f,\"ts\":%d}", lat, lng, System.currentTimeMillis());
        redisTemplate.opsForValue().set(KEY_PREFIX + driverId, payload, LOCATION_TTL);
    }
}
