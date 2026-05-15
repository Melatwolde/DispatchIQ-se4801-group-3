package com.dispatchiq.backend.api.mapper;

import com.dispatchiq.backend.api.dto.FleetDto;

public final class FleetMapper {
    private FleetMapper() {}

    public static FleetDto withId(String id, FleetDto dto) {
        return new FleetDto(id, dto.name(), dto.region());
    }
}
