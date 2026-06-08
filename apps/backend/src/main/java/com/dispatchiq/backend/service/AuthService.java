package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.request.LoginRequest;
import com.dispatchiq.backend.api.dto.request.RegisterRequest;
import com.dispatchiq.backend.api.dto.response.AuthResponse;
import com.dispatchiq.backend.entity.User;
import com.dispatchiq.backend.repository.UserRepository;
import com.dispatchiq.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Parse phone string into numeric value (strip non-digits)
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

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(phoneNumber)
                .role(request.getRole())
                .build();

        userRepository.save(user);
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getId(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getId(), user.getRole().name());
    }
}