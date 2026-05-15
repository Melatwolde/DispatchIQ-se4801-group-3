package com.dispatchiq.backend.idempotency;

public interface IdempotencyService {
    /**
     * Try to acquire idempotency key. Returns true if acquired, false if key already exists (locked).
     */
    boolean acquire(String key);
}
