package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.DeliveryDto;
import com.dispatchiq.backend.api.dto.request.DeliveryRequestDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DeliveryService {
    DeliveryDto create(DeliveryDto dto);
    DeliveryDto createFromRequest(DeliveryRequestDTO request);
    Page<DeliveryDto> list(Pageable pageable, String status);
}
