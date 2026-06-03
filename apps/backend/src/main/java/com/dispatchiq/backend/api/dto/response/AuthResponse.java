package com.dispatchiq.backend.api.dto.response;

import java.util.UUID;

public class AuthResponse {

    private String accessToken;
    private UUID userId;
    private String role;

    public AuthResponse(String accessToken, UUID userId, String role) {
        this.accessToken = accessToken;
        this.userId = userId;
        this.role = role;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
