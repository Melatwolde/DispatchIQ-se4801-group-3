package com.dispatchiq.backend.service.impl;

import com.dispatchiq.backend.api.dto.FleetDto;
import com.dispatchiq.backend.entity.User;
import com.dispatchiq.backend.entity.Vehicle;
import com.dispatchiq.backend.repository.UserRepository;
import com.dispatchiq.backend.repository.VehicleRepository;
import com.dispatchiq.backend.service.FleetService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InMemoryFleetService implements FleetService {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final List<FleetDto> store = new ArrayList<>();

    @Override
    public FleetDto create(FleetDto dto) {
        String id = UUID.randomUUID().toString();
        FleetDto created = new FleetDto(id, dto.name(), dto.region());
        store.add(created);
        return created;
    }

    @Override
    public Page<FleetDto> list(Pageable pageable) {
        int start = Math.min((int)pageable.getOffset(), store.size());
        int end = Math.min(start + pageable.getPageSize(), store.size());
        return new PageImpl<>(store.subList(start, end), pageable, store.size());
    }

    @Override
    @Transactional
    public void approveDispatcher(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setOnboardingStatus("APPROVED");
        userRepository.save(user);

        vehicleRepository.findAll().stream()
                .filter(v -> v.getDriver() != null && userId.equals(v.getDriver().getId()))
                .findFirst()
                .ifPresent(vehicle -> {
                    vehicle.setOnboardingStatus("APPROVED");
                    vehicleRepository.save(vehicle);
                });
    }
}