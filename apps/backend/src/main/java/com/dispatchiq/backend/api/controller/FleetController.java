package com.dispatchiq.backend.api.controller;

import com.dispatchiq.backend.api.dto.FleetDto;
import com.dispatchiq.backend.service.FleetService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/fleets")
@Validated
@Tag(name = "fleets", description = "Fleet management")
public class FleetController {

    private final FleetService fleetService;

    public FleetController(FleetService fleetService) {
        this.fleetService = fleetService;
    }

    @PostMapping
    public ResponseEntity<FleetDto> create(@Valid @RequestBody FleetDto dto) {
        FleetDto created = fleetService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<Page<FleetDto>> list(@PageableDefault(size = 20) Pageable pageable) {
        Page<FleetDto> page = fleetService.list(pageable);
        return ResponseEntity.ok(page);
    }
}
