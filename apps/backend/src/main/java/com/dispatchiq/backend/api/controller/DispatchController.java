package com.dispatchiq.backend.api.controller;

import com.dispatchiq.backend.api.dto.DispatchDto;
import com.dispatchiq.backend.service.DispatchService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/dispatches")
@Validated
@Tag(name = "dispatches", description = "Dispatch operations")
public class DispatchController {

    private final DispatchService dispatchService;

    public DispatchController(DispatchService dispatchService) {
        this.dispatchService = dispatchService;
    }

    @PostMapping
    public ResponseEntity<DispatchDto> create(@Valid @RequestBody DispatchDto dto) {
        DispatchDto created = dispatchService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
