package com.dispatchiq.backend.api.mapper;

import com.dispatchiq.backend.api.dto.AssignmentRequest;
import com.dispatchiq.backend.api.dto.AssignmentResponse;

/**
 * Manual mapper placeholders. Keep mapping logic here to avoid exposing entities.
 */
public final class AssignmentMapper {
    private AssignmentMapper() {}

    public static AssignmentResponse toResponse(String publicId, AssignmentRequest req) {
        return new AssignmentResponse(publicId, "ASSIGNED", "Assigned to driver");
    }
}
