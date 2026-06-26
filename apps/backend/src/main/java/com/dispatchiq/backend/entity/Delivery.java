package com.dispatchiq.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    @NotBlank
    @Column(name = "pickup_address", columnDefinition = "TEXT")
    private String pickupAddress;

    @Column(name = "pickup_coords", columnDefinition = "geography(Point,4326)")
    private String pickupCoords;

    @NotBlank
    @Column(name = "dropoff_address", columnDefinition = "TEXT")
    private String dropoffAddress;

    @Column(name = "dropoff_coords", columnDefinition = "geography(Point,4326)")
    private String dropoffCoords;

    @Column(name = "requested_pickup_time")
    private OffsetDateTime requestedPickupTime;

    @Column(name = "deadline")
    private OffsetDateTime deadline;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", columnDefinition = "delivery_priority")
    @org.hibernate.annotations.ColumnTransformer(write = "?::delivery_priority")
    private DeliveryPriority priority = DeliveryPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "delivery_status")
    @org.hibernate.annotations.ColumnTransformer(write = "?::delivery_status")
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

    @Transient
    private Double pickupLatitude;

    @Transient
    private Double pickupLongitude;

    @Transient
    private Double dropoffLatitude;

    @Transient
    private Double dropoffLongitude;

    @Transient
    private DeliveryUrgency urgency;

    @PrePersist
    @PreUpdate
    void applyDefaults() {
        if (status == null) {
            status = DeliveryStatus.PENDING;
        }
        if (priority == null) {
            priority = DeliveryPriority.MEDIUM;
        }
    }

    public static Delivery fromRequest(
            DeliveryUrgency urgency,
            DeliveryStatus status,
            String pickupAddress,
            double pickupLatitude,
            double pickupLongitude,
            String dropoffAddress,
            double dropoffLatitude,
            double dropoffLongitude,
            String notes,
            User customer
    ) {
        Delivery delivery = new Delivery();
        delivery.setCustomer(customer);
        delivery.setPickupAddress(pickupAddress);
        delivery.setPickupLatitude(pickupLatitude);
        delivery.setPickupLongitude(pickupLongitude);
        delivery.setDropoffAddress(dropoffAddress);
        delivery.setDropoffLatitude(dropoffLatitude);
        delivery.setDropoffLongitude(dropoffLongitude);
        delivery.setUrgency(urgency);
        delivery.setPriority(urgency.toPriority());
        delivery.setStatus(status != null ? status : DeliveryStatus.PENDING);
        delivery.setSpecialInstructions(notes);
        return delivery;
    }
}
