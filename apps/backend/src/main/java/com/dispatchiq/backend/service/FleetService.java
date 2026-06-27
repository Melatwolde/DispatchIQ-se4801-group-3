package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.FleetDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

public interface FleetService {
    FleetDto create(FleetDto dto);
    Page<FleetDto> list(Pageable pageable);
    void approveDispatcher(UUID userId);
}