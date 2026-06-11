package com.dispatchiq.backend.service.impl;

import com.dispatchiq.backend.api.dto.DeliveryDto;
import com.dispatchiq.backend.api.mapper.DeliveryMapper;
import com.dispatchiq.backend.entity.Delivery;
import com.dispatchiq.backend.entity.User;
import com.dispatchiq.backend.repository.DeliveryRepository;
import com.dispatchiq.backend.repository.UserRepository;
import com.dispatchiq.backend.service.DeliveryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
public class InMemoryDeliveryService implements DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final UserRepository userRepository;

    public InMemoryDeliveryService(DeliveryRepository deliveryRepository, UserRepository userRepository) {
        this.deliveryRepository = deliveryRepository;
        this.userRepository = userRepository;
    }

    @Override
    public DeliveryDto create(DeliveryDto dto) {
        // 1. Extract the authenticated user's email out of the Spring Security context
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email;

        if (principal instanceof UserDetails userDetails) {
            email = userDetails.getUsername();
        } else {
            email = principal.toString();
        }

        // 2. Query the user record to resolve the real UUID key using her case-insensitive method
        User currentUser = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("Authenticated client identity not found for: " + email));

        UUID realCustomerId = currentUser.getId();

        // 3. Save directly into your PostgreSQL database using the PostGIS spatial engine
        // We call .toOffsetDateTime() on the ZonedDateTime parameters so they match your entity fields!
        deliveryRepository.saveDeliveryWithCoords(
            realCustomerId,
            dto.pickupAddress(),
            dto.pickupLongitude(),
            dto.pickupLatitude(),
            dto.dropoffAddress(),
            dto.dropoffLongitude(),
            dto.dropoffLatitude(),
            dto.requestedPickupTime() != null ? dto.requestedPickupTime().toOffsetDateTime() : null,
            dto.deadline() != null ? dto.deadline().toOffsetDateTime() : null,
            dto.priority() != null ? dto.priority().name() : "MEDIUM",
            dto.status() != null ? dto.status().name() : "PENDING",
            dto.specialInstructions()
        );

        return DeliveryMapper.withId(UUID.randomUUID().toString(), dto);
    }

    @Override
    public Page<DeliveryDto> list(Pageable pageable, String status) {
        Page<Delivery> entities = deliveryRepository.findAll(pageable);
        
        List<DeliveryDto> dtos = entities.stream()
                .map(DeliveryMapper::toDto)
                .toList();
                
        return new PageImpl<>(dtos, pageable, entities.getTotalElements());
    }
}