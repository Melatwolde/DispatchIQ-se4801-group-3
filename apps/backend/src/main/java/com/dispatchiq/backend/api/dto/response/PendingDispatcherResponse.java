package com.dispatchiq.backend.api.dto.response;

import java.util.UUID;

public class PendingDispatcherResponse {
    private UUID userId;
    private String fullName;
    private String email;
    private Long phone;
    
    private UUID vehicleId;
    private String licensePlate;
    private String vin;
    private String capacity;
    private String currentLocation;

    public PendingDispatcherResponse(UUID userId, String fullName, String email, Long phone, 
                                     UUID vehicleId, String licensePlate, String vin, 
                                     String capacity, String currentLocation) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.vehicleId = vehicleId;
        this.licensePlate = licensePlate;
        this.vin = vin;
        this.capacity = capacity;
        this.currentLocation = currentLocation;
    }

    // Getters
    public UUID getUserId() { return userId; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public Long getPhone() { return phone; }
    public UUID getVehicleId() { return vehicleId; }
    public String getLicensePlate() { return licensePlate; }
    public String getVin() { return vin; }
    public String getCapacity() { return capacity; }
    public String getCurrentLocation() { return currentLocation; }
}