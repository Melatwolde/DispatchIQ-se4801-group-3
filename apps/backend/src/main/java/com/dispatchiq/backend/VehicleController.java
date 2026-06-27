package com.dispatchiq.backend;

import com.dispatchiq.backend.api.dto.VehicleDto;
import com.dispatchiq.backend.entity.Vehicle;
import com.dispatchiq.backend.service.VehicleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/vehicles")
@CrossOrigin(origins = "*") // Allows your frontend application to talk to this endpoint safely
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @PostMapping("/register")
    public ResponseEntity<Vehicle> registerVehicle(@RequestBody VehicleDto vehicleDto) {
        Vehicle savedVehicle = vehicleService.registerVehicle(vehicleDto);
        return new ResponseEntity<>(savedVehicle, HttpStatus.CREATED);
    }
}