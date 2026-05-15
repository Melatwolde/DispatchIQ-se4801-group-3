package com.dispatchiq.backend.service.impl;

import com.dispatchiq.backend.api.dto.FleetDto;
import com.dispatchiq.backend.service.FleetService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class InMemoryFleetService implements FleetService {

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
}
