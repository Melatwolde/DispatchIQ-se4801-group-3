package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.AssignmentRequest;
import com.dispatchiq.backend.api.dto.AssignmentResponse;

public interface AssignmentService {
    AssignmentResponse assign(AssignmentRequest request);
    AssignmentResponse reassign(String publicId, AssignmentRequest request);
}
