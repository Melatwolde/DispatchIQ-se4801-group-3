package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.FleetDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FleetService {
    FleetDto create(FleetDto dto);
    Page<FleetDto> list(Pageable pageable);
}
