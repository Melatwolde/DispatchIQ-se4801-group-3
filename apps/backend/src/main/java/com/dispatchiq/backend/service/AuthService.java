package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.request.LoginRequest;
import com.dispatchiq.backend.api.dto.request.RegisterRequest;
import com.dispatchiq.backend.api.dto.response.AuthResponse;
import com.dispatchiq.backend.entity.User;
import com.dispatchiq.backend.entity.Vehicle;
import com.dispatchiq.backend.entity.Role;
import com.dispatchiq.backend.repository.UserRepository;
import com.dispatchiq.backend.repository.VehicleRepository;
import com.dispatchiq.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        if (request.getRole() == Role.DISPATCHER) {
            if (request.getLicensePlate() == null || request.getLicensePlate().isBlank()) {
                throw new IllegalArgumentException("License plate is required for dispatcher registration");
            }
            if (request.getVin() == null || request.getVin().isBlank()) {
                throw new IllegalArgumentException("VIN code is required for dispatcher registration");
            }
            if (vehicleRepository.existsByLicensePlate(request.getLicensePlate())) {
                throw new IllegalArgumentException("License plate already registered");
            }
            if (vehicleRepository.existsByVin(request.getVin())) {
                throw new IllegalArgumentException("VIN already registered");
            }
        }

        Long phoneNumber = null;
        if (request.getPhone() != null) {
            String digits = request.getPhone().replaceAll("\\D+", "");
            if (!digits.isEmpty()) {
                try {
                    phoneNumber = Long.parseLong(digits);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Invalid phone number");
                }
            }
        }

        String onboardingStatus = (request.getRole() == Role.DISPATCHER) ? "PENDING_APPROVAL" : "APPROVED";
        // Restrict admin registration to the single pre-approved admin account
        if (request.getRole() == Role.ADMIN) {
            if (!"admin@dispatchiq.com".equalsIgnoreCase(request.getEmail()) || !"password".equals(request.getPassword())) {
                throw new IllegalArgumentException("Admin registration is restricted");
            }
            // admin uses APPROVED onboarding
            onboardingStatus = "APPROVED";
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(phoneNumber)
                .role(request.getRole())
                .onboardingStatus(onboardingStatus)
                .build();

        userRepository.save(user);

        if (request.getRole() == Role.DISPATCHER) {
            Vehicle vehicle = new Vehicle();
            vehicle.setLicensePlate(request.getLicensePlate());
            vehicle.setVin(request.getVin());
            vehicle.setCapacity(request.getCapacity());
            vehicle.setCurrentLocation(request.getCurrentLocation());
            vehicle.setOnboardingStatus("PENDING_APPROVAL");
            vehicle.setDriver(user);
            vehicleRepository.save(vehicle);

            return new AuthResponse(null, user.getId(), user.getRole().name());
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getId(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!user.isEnabled()) {
            throw new IllegalArgumentException("Your account is pending administrator approval");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getId(), user.getRole().name());
    }
}