package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.VehicleDto;
import com.dispatchiq.backend.entity.MaintenanceStatus;
import com.dispatchiq.backend.entity.User;
import com.dispatchiq.backend.entity.Vehicle;
import com.dispatchiq.backend.entity.VehicleStatus;
import com.dispatchiq.backend.repository.UserRepository;
import com.dispatchiq.backend.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public VehicleService(VehicleRepository vehicleRepository, UserRepository userRepository) {
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Vehicle registerVehicle(VehicleDto dto) {
        // 1. Enforce unique constraints
        if (vehicleRepository.existsByLicensePlate(dto.getLicensePlate())) {
            throw new RuntimeException("License plate already registered in the system!");
        }
        if (vehicleRepository.existsByVin(dto.getVin())) {
            throw new RuntimeException("VIN already registered in the system!");
        }

        // 2. Instantiate new Vehicle database model
        Vehicle vehicle = new Vehicle();
        vehicle.setLicensePlate(dto.getLicensePlate());
        vehicle.setVin(dto.getVin());
        vehicle.setCapacity(dto.getCapacity());
        vehicle.setCurrentLocation(dto.getCurrentLocation());
        vehicle.setLastMaintenanceDate(dto.getLastMaintenanceDate());

        // 3. Map string values cleanly to their respective database Enums
        if (dto.getMaintenanceStatus() != null) {
            vehicle.setMaintenanceStatus(MaintenanceStatus.valueOf(dto.getMaintenanceStatus().toUpperCase()));
        }
        if (dto.getVehicleStatus() != null) {
            vehicle.setVehicleStatus(VehicleStatus.valueOf(dto.getVehicleStatus().toUpperCase()));
        }

        // 4. Link an existing driver account to the truck if selected
        if (dto.getDriverId() != null) {
            User driver = userRepository.findById(dto.getDriverId())
                    .orElseThrow(() -> new RuntimeException("Driver not found with ID: " + dto.getDriverId()));
            vehicle.setDriver(driver);
        }

        // 5. Commit to the database
        return vehicleRepository.save(vehicle);
    }
}