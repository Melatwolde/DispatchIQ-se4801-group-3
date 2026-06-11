package com.dispatchiq.backend.api.controller;

import com.dispatchiq.backend.api.dto.DeliveryDto;
import com.dispatchiq.backend.service.DeliveryService;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/deliveries")
@org.springframework.web.bind.annotation.CrossOrigin(origins = "http://localhost:3000")
@Validated
@Tag(name = "deliveries", description = "Delivery CRUD and list operations")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @PostMapping
    public ResponseEntity<DeliveryDto> create(@Valid @RequestBody DeliveryDto dto) {
        DeliveryDto created = deliveryService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<Page<DeliveryDto>> list(@PageableDefault(size = 20) Pageable pageable, @RequestParam(required = false) String status) {
        Page<DeliveryDto> page = deliveryService.list(pageable, status);
        return ResponseEntity.ok(page);
    }
}
