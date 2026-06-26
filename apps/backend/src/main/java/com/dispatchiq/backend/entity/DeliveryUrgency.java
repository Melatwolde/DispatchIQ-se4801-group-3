package com.dispatchiq.backend.entity;

public enum DeliveryUrgency {
    LOW,
    NORMAL,
    URGENT,
    CRITICAL;

    public DeliveryPriority toPriority() {
        return switch (this) {
            case LOW -> DeliveryPriority.LOW;
            case NORMAL -> DeliveryPriority.MEDIUM;
            case URGENT -> DeliveryPriority.URGENT;
            case CRITICAL -> DeliveryPriority.HIGH;
        };
    }
}
