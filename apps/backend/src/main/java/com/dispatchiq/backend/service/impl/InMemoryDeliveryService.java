package com.dispatchiq.backend.service.impl;

import com.dispatchiq.backend.api.dto.AssignmentRequest;
import com.dispatchiq.backend.api.dto.DeliveryDto;
import com.dispatchiq.backend.api.dto.request.DeliveryRequestDTO;
import com.dispatchiq.backend.api.mapper.DeliveryMapper;
import com.dispatchiq.backend.entity.Delivery;
import com.dispatchiq.backend.entity.DeliveryStatus;
import com.dispatchiq.backend.entity.User;
import com.dispatchiq.backend.repository.DeliveryRepository;
import com.dispatchiq.backend.repository.UserRepository;
import com.dispatchiq.backend.service.AssignmentService;
import com.dispatchiq.backend.service.DeliveryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class InMemoryDeliveryService implements DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final UserRepository userRepository;
    private final AssignmentService assignmentService;

    public InMemoryDeliveryService(DeliveryRepository deliveryRepository, UserRepository userRepository, AssignmentService assignmentService) {
        this.deliveryRepository = deliveryRepository;
        this.userRepository = userRepository;
        this.assignmentService = assignmentService;
    }

    @Override
    public DeliveryDto create(DeliveryDto dto) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = principal instanceof UserDetails userDetails ? 
                userDetails.getUsername() : principal.toString();

        User currentUser = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("Authenticated client not found"));

        UUID deliveryId = UUID.randomUUID();
        System.out.println("Creating delivery with generated ID: " + deliveryId);

        deliveryRepository.saveDeliveryWithCoords(
            deliveryId,
            currentUser.getId(),
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

        System.out.println("Delivery native insert complete for ID: " + deliveryId);
        return DeliveryMapper.withId(deliveryId.toString(), dto);
    }

@Override
public DeliveryDto createFromRequest(DeliveryRequestDTO request) {
    System.out.println("=== DELIVERY CREATION STARTED ===");
    System.out.println("Pickup: " + request.pickupAddress());
    System.out.println("Dropoff: " + request.dropoffAddress());

    try {
        User customer = resolveCustomer();
        System.out.println("Customer found: " + customer.getId());

        DeliveryStatus status = request.status() != null ? request.status() : DeliveryStatus.PENDING;

        UUID deliveryId = UUID.randomUUID();
        System.out.println("Creating delivery with generated ID: " + deliveryId);

        // Execute the native insert
        deliveryRepository.saveDeliveryWithCoords(
            deliveryId,
            customer.getId(),
            request.pickupAddress(),
            request.pickupLongitude(),
            request.pickupLatitude(),
            request.dropoffAddress(),
            request.dropoffLongitude(),
            request.dropoffLatitude(),
            null,
            null,
            request.urgency().toPriority().name(),
            status.name(),
            request.notes() != null ? request.notes() : ""
        );

        System.out.println("Native insert executed successfully for delivery ID: " + deliveryId);

        // Auto-create assignment so dispatcher can accept/reject
        try {
            AssignmentRequest assignmentReq = new AssignmentRequest(
                deliveryId.toString(),
                null,  // Let the system choose driver via matching algorithm
                request.urgency().toPriority().ordinal() + 1,  // Convert to priority level
                "Auto-assigned for dispatcher approval"
            );
            assignmentService.assign(assignmentReq);
            System.out.println("Auto-created assignment for delivery ID: " + deliveryId);
        } catch (Exception e) {
            System.err.println("⚠️ Failed to auto-create assignment for delivery: " + e.getMessage());
            // Don't fail delivery creation if assignment fails; log and continue
        }

        // Return proper DTO
        return new DeliveryDto(
            deliveryId.toString(),
            status,
            request.pickupAddress(),
            request.pickupLatitude(),
            request.pickupLongitude(),
            request.dropoffAddress(),
            request.dropoffLatitude(),
            request.dropoffLongitude(),
            null,
            null,
            request.urgency().toPriority(),
            request.notes()
        );

    } catch (Exception e) {
        System.err.println("❌ FAILED to create delivery: " + e.getMessage());
        e.printStackTrace();
        throw new RuntimeException("Failed to create delivery: " + e.getMessage(), e);
    }
}
    private User resolveCustomer() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return userRepository.findByEmailIgnoreCase(userDetails.getUsername())
                    .orElseThrow(() -> new UsernameNotFoundException("Authenticated customer not found"));
        }
        throw new UsernameNotFoundException("Authenticated customer required");
    }

    private Delivery setCoords(Delivery d) {
    if (d != null) {
        // Handle Pickup Coordinates
        if (d.getPickupCoords() != null && !d.getPickupCoords().isEmpty()) {
            d.setPickupLongitude(d.getPickupCoords().getX());
            d.setPickupLatitude(d.getPickupCoords().getY());
        } else {
            Double pickupLat = deliveryRepository.findPickupLatitudeById(d.getId());
            Double pickupLong = deliveryRepository.findPickupLongitudeById(d.getId());
            d.setPickupLatitude(pickupLat != null ? pickupLat : 0.0);
            d.setPickupLongitude(pickupLong != null ? pickupLong : 0.0);
        }
        
        // Handle Dropoff Coordinates
        if (d.getDropoffCoords() != null && !d.getDropoffCoords().isEmpty()) {
            d.setDropoffLongitude(d.getDropoffCoords().getX());
            d.setDropoffLatitude(d.getDropoffCoords().getY());
        } else {
            Double dropoffLat = deliveryRepository.findDropoffLatitudeById(d.getId());
            Double dropoffLong = deliveryRepository.findDropoffLongitudeById(d.getId());
            d.setDropoffLatitude(dropoffLat != null ? dropoffLat : 0.0);
            d.setDropoffLongitude(dropoffLong != null ? dropoffLong : 0.0);
        }
    }
    return d;
}


    /** Parse a WKT POINT string like "POINT(lng lat)" and return {lng, lat}. */
    private double[] parseWktPoint(String wkt) {
        String inner = wkt.replaceAll("(?i)^POINT\\s*\\(", "").replaceAll("\\)$", "").trim();
        String[] parts = inner.split("\\s+");
        return new double[]{Double.parseDouble(parts[0]), Double.parseDouble(parts[1])};
    }

    @Override
    public Page<DeliveryDto> list(Pageable pageable, String status) {
        Page<Delivery> entities = deliveryRepository.findAll(pageable);
        
        List<DeliveryDto> dtos = entities.stream()
                .map(this::setCoords)
                .map(DeliveryMapper::toDto)
                .toList();
                
        return new PageImpl<>(dtos, pageable, entities.getTotalElements());
    }


    @Override
    @Transactional(readOnly = true)
    public Page<DeliveryDto> getAvailableDeliveries(Pageable pageable) {
        Page<Delivery> entities = deliveryRepository.findUnassignedPending(pageable);
        
        List<DeliveryDto> dtos = entities.stream()
                .map(this::setCoords)
                .map(DeliveryMapper::toDto)
                .toList();
                
        return new PageImpl<>(dtos, pageable, entities.getTotalElements());
    }

    @Override
    public Optional<DeliveryDto> findById(UUID id) {
        return deliveryRepository.findById(id)
                .map(this::setCoords)
                .map(DeliveryMapper::toDto);
    }

    @Override
    public DeliveryDto reject(UUID id) {
        // Implementation for delivery rejection (if applicable)
        return findById(id).orElseThrow(() -> new RuntimeException("Delivery not found: " + id));
    }
}