package com.dispatchiq.backend.repository;

import com.dispatchiq.backend.entity.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.UUID;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, UUID> {

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO deliveries (id, customer_id, pickup_address, pickup_coords, dropoff_address, dropoff_coords, requested_pickup_time, deadline, priority, status, special_instructions) " +
                   "VALUES (gen_random_uuid(), :customerId, :pickupAddress, ST_SetSRID(ST_MakePoint(:pickupLong, :pickupLat), 4326), :dropoffAddress, ST_SetSRID(ST_MakePoint(:dropoffLong, :dropoffLat), 4326), :requestedPickupTime, :deadline, cast(:priority as delivery_priority), cast(:status as delivery_status), :specialInstructions)", 
           nativeQuery = true)
    void saveDeliveryWithCoords(
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
}