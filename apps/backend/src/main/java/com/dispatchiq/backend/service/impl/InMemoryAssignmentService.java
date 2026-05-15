package com.dispatchiq.backend.service.impl;

import com.dispatchiq.backend.api.dto.AssignmentRequest;
import com.dispatchiq.backend.api.dto.AssignmentResponse;
import com.dispatchiq.backend.service.AssignmentService;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class InMemoryAssignmentService implements AssignmentService {

    private final Map<String, AssignmentResponse> store = new ConcurrentHashMap<>();

    @Override
    public AssignmentResponse assign(AssignmentRequest request) {
        String publicId = UUID.randomUUID().toString();
        AssignmentResponse resp = new AssignmentResponse(publicId, "ASSIGNED", "Assigned to driver");
        store.put(publicId, resp);
        return resp;
    }

    @Override
    public AssignmentResponse reassign(String publicId, AssignmentRequest request) {
        // purely delegation-level stub: create a new response but preserve id
        AssignmentResponse resp = new AssignmentResponse(publicId, "REASSIGNED", "Reassigned to new driver");
        store.put(publicId, resp);
        return resp;
    }
}
