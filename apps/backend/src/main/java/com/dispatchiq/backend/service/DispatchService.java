package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.DispatchDto;

public interface DispatchService {
    DispatchDto create(DispatchDto dto);
}
