package com.dispatchiq.backend.service.impl;

import com.dispatchiq.backend.api.dto.DispatchDto;
import com.dispatchiq.backend.service.DispatchService;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class InMemoryDispatchService implements DispatchService {

    @Override
    public DispatchDto create(DispatchDto dto) {
        String id = UUID.randomUUID().toString();
        return new DispatchDto(id, dto.assignmentId(), dto.dispatchedAt());
    }
}
