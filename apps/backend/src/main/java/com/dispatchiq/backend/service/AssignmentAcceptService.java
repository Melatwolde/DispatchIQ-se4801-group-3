package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.AssignmentAcceptResponse;

import java.util.UUID;

public interface AssignmentAcceptService {
    AssignmentAcceptResponse acceptAssignment(UUID assignmentId, UUID driverId);
}
