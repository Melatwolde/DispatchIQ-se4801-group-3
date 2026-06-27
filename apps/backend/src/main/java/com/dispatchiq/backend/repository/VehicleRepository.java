package com.dispatchiq.backend.repository;

import com.dispatchiq.backend.entity.Vehicle;
import com.dispatchiq.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {
    boolean existsByLicensePlate(String licensePlate);
    boolean existsByVin(String vin);
    
    
    Optional<Vehicle> findByDriver(User driver);
}