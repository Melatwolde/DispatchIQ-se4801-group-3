package com.dispatchiq.backend.service.impl;

import com.dispatchiq.backend.api.dto.DeliveryDto;
import com.dispatchiq.backend.service.DeliveryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class InMemoryDeliveryService implements DeliveryService {

    private final List<DeliveryDto> store = new ArrayList<>();

    @Override
    public DeliveryDto create(DeliveryDto dto) {
        String id = UUID.randomUUID().toString();
        DeliveryDto created = new DeliveryDto(id, dto.status(), dto.address());
        store.add(created);
        return created;
    }

    @Override
    public Page<DeliveryDto> list(Pageable pageable, String status) {
        List<DeliveryDto> filtered = store;
        if (status != null && !status.isBlank()) {
            filtered = store.stream().filter(d -> status.equalsIgnoreCase(d.status())).toList();
        }
        int start = Math.min((int)pageable.getOffset(), filtered.size());
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        return new PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
    }
}
