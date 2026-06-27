package com.dispatchiq.backend.api.controller;

import com.dispatchiq.backend.api.dto.DeliveryDto;
import com.dispatchiq.backend.api.dto.request.DeliveryRequestDTO;
import com.dispatchiq.backend.service.DeliveryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/deliveries")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
@Validated
@Tag(name = "deliveries", description = "Delivery CRUD and list operations")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @PostMapping
    public ResponseEntity<DeliveryDto> create(@Valid @RequestBody DeliveryRequestDTO request) {
        DeliveryDto created = deliveryService.createFromRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<Page<DeliveryDto>> list(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) String status
    ) {
        Page<DeliveryDto> page = deliveryService.list(pageable, status);
        return ResponseEntity.ok(page);
    }
}
