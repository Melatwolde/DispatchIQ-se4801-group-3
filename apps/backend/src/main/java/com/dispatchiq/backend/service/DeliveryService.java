package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.DeliveryDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DeliveryService {
    DeliveryDto create(DeliveryDto dto);
    Page<DeliveryDto> list(Pageable pageable, String status);
}
