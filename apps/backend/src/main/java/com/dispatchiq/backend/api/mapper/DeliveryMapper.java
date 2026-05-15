package com.dispatchiq.backend.api.mapper;

import com.dispatchiq.backend.api.dto.DeliveryDto;

public final class DeliveryMapper {
    private DeliveryMapper() {}

    public static DeliveryDto withId(String id, DeliveryDto dto) {
        return new DeliveryDto(id, dto.status(), dto.address());
    }
}
