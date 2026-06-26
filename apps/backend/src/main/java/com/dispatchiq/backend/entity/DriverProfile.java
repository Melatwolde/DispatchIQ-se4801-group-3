package com.dispatchiq.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "driver_profiles")
@Data
@NoArgsConstructor
public class DriverProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "structural_state", nullable = false, columnDefinition = "driver_structural_state")
    @org.hibernate.annotations.ColumnTransformer(write = "?::driver_structural_state")
    private DriverStructuralState structuralState = DriverStructuralState.AVAILABLE;

    @Column(name = "capacity_cap", nullable = false)
    private int capacityCap = 3;

    @Column(name = "current_lat")
    private Double currentLat;

    @Column(name = "current_lng")
    private Double currentLng;

    @Column(name = "proximity_radius_meters", nullable = false)
    private int proximityRadiusMeters = 5000;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
