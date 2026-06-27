package com.dispatchiq.backend.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class AssignmentValidationException extends RuntimeException {
    public AssignmentValidationException(String message) {
        super(message);
    }
}
