package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.AssignmentRequest;
import com.dispatchiq.backend.api.dto.AssignmentResponse;

import java.util.UUID;

import java.util.List;
import com.dispatchiq.backend.api.dto.PendingAssignmentDto;

public interface AssignmentService {
    AssignmentResponse assign(AssignmentRequest request);
    AssignmentResponse reassign(String publicId, AssignmentRequest request);
    AssignmentResponse reject(UUID assignmentId, UUID driverId);
    List<PendingAssignmentDto> getPendingAssignments(UUID driverId);
    List<PendingAssignmentDto> getAssignmentsForDispatcherApproval();
    AssignmentResponse approveByDispatcher(UUID assignmentId);
}
