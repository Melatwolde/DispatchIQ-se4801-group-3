package com.dispatchiq.backend.repository;

import com.dispatchiq.backend.entity.Delivery;
import com.dispatchiq.backend.entity.DeliveryStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, UUID> {

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO deliveries (id, customer_id, pickup_address, pickup_coords, dropoff_address, dropoff_coords, requested_pickup_time, deadline, priority, status, special_instructions) " +
                   "VALUES (:id, :customerId, :pickupAddress, ST_SetSRID(ST_MakePoint(:pickupLong, :pickupLat), 4326), :dropoffAddress, ST_SetSRID(ST_MakePoint(:dropoffLong, :dropoffLat), 4326), :requestedPickupTime, :deadline, cast(:priority as delivery_priority), cast(:status as delivery_status), :specialInstructions)",
           nativeQuery = true)
    void saveDeliveryWithCoords(
        @Param("id") UUID id,
        @Param("customerId") UUID customerId,
        @Param("pickupAddress") String pickupAddress,
        @Param("pickupLong") Double pickupLong,
        @Param("pickupLat") Double pickupLat,
        @Param("dropoffAddress") String dropoffAddress,
        @Param("dropoffLong") Double dropoffLong,
        @Param("dropoffLat") Double dropoffLat,
        @Param("requestedPickupTime") OffsetDateTime requestedPickupTime,
        @Param("deadline") OffsetDateTime deadline,
        @Param("priority") String priority,
        @Param("status") String status,
        @Param("specialInstructions") String specialInstructions
    );

    // CHANGED: Converted to native SQL query with explicit PostgreSQL enum casting
    @Modifying
    @Transactional
    @Query(value = "UPDATE deliveries SET status = cast(:status as delivery_status) WHERE id = :id", nativeQuery = true)
    void updateStatusById(@Param("id") UUID id, @Param("status") String status);

    // Helper overload method to accept Enum types directly so you do not break existing service calls
    default void updateStatusById(UUID id, DeliveryStatus status) {
        updateStatusById(id, status != null ? status.name() : null);
    }

    @Query(value = "SELECT ST_X(CAST(pickup_coords AS geometry)) FROM deliveries WHERE id = :id", nativeQuery = true)
    Double findPickupLongitudeById(@Param("id") UUID id);

    @Query(value = "SELECT ST_Y(CAST(pickup_coords AS geometry)) FROM deliveries WHERE id = :id", nativeQuery = true)
    Double findPickupLatitudeById(@Param("id") UUID id);

    @Query(value = "SELECT ST_X(CAST(dropoff_coords AS geometry)) FROM deliveries WHERE id = :id", nativeQuery = true)
    Double findDropoffLongitudeById(@Param("id") UUID id);

    @Query(value = "SELECT ST_Y(CAST(dropoff_coords AS geometry)) FROM deliveries WHERE id = :id", nativeQuery = true)
    Double findDropoffLatitudeById(@Param("id") UUID id);

    @Modifying
    @Transactional
    @Query(value = "UPDATE deliveries SET " +
                "customer_id = :customerId, deadline = :deadline, " +
                "dropoff_address = :dropoffAddress, dropoff_coords = ST_GeogFromText(:dropoffCoords), " +
                "pickup_address = :pickupAddress, pickup_coords = ST_GeogFromText(:pickupCoords), " +
                "priority = cast(:priority as delivery_priority), status = cast(:status as delivery_status), " +
                "special_instructions = :specialInstructions, updated_at = NOW() " +
                "WHERE id = :id", nativeQuery = true)
    void updateDeliveryWithCoords(
        @Param("id") UUID id,
        @Param("customerId") UUID customerId,
        @Param("pickupAddress") String pickupAddress,
        @Param("pickupCoords") String pickupCoords,
        @Param("dropoffAddress") String dropoffAddress,
        @Param("dropoffCoords") String dropoffCoords,
        @Param("deadline") OffsetDateTime deadline,
        @Param("priority") String priority,
        @Param("status") String status,
        @Param("specialInstructions") String specialInstructions
    );

    @Query("SELECT d FROM Delivery d WHERE d.status = com.dispatchiq.backend.entity.DeliveryStatus.PENDING")
    Page<Delivery> findUnassignedPending(Pageable pageable);
    
}
