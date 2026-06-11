package com.dispatchiq.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "deliveries")
@Data
@NoArgsConstructor
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Column(name = "pickup_address", columnDefinition = "TEXT")
    private String pickupAddress;

    @Column(name = "pickup_coords", columnDefinition = "geography(Point,4326)")
    private String pickupCoords; 

    @Column(name = "dropoff_address", columnDefinition = "TEXT")
    private String dropoffAddress;

    @Column(name = "dropoff_coords", columnDefinition = "geography(Point,4326)")
    private String dropoffCoords;

    @Column(name = "requested_pickup_time")
    private OffsetDateTime requestedPickupTime;

    @Column(name = "deadline")
    private OffsetDateTime deadline;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", columnDefinition = "delivery_priority")
    private DeliveryPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "delivery_status")
    private DeliveryStatus status = DeliveryStatus.PENDING;

    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;

    @Column(name = "proof_of_delivery_json", columnDefinition = "jsonb")
    private String proofOfDeliveryJson;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}