package com.dispatchiq.backend.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityAuthTest {

    @Autowired
    private MockMvc mockMvc;

    /**
     * 1. Unauthenticated Check
     * Verifies that requests without an authorization context to protected
     * endpoints
     * are rejected immediately by the security filter chain.
     */
    @Test
    @DisplayName("Should return 401 Unauthorized when accessing protected endpoints without credentials")
    public void unauthenticatedUsers_AreDeniedAccess() throws Exception {
        mockMvc.perform(get("/api/v1/assignments")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    /**
     * 2. Authenticated Access Check
     * Simulates a successfully authenticated user context via standard JWT or
     * Session mechanisms
     * to ensure the secure endpoint successfully fulfills the communication loop.
     */
    @Test
    @WithMockUser(username = "driver_user", roles = { "DRIVER" })
    @DisplayName("Should return 200 OK when authenticated user accesses permitted endpoint")
    public void authenticatedUsers_CanAccessPermittedEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/assignments")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    /**
     * 3. Role-Based Access Control Check
     * Validates that permissions are properly segmented. A user assigned the
     * 'DRIVER' role
     * must be barred from administrative operations (e.g., dispatcher management
     * paths).
     */
    @Test
    @WithMockUser(username = "unauthorized_driver", roles = { "DRIVER" })
    @DisplayName("Should return 403 Forbidden when user lacks the required management role")
    public void driverRole_CannotAccessManagementEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/assignments/management-summary")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    /**
     * 4. Management RBAC Check
     * Validates that authorized roles (e.g., 'DISPATCHER') are correctly authorized
     * by
     * Spring Security rules to touch management resources.
     */
    @Test
    @WithMockUser(username = "dispatcher_user", roles = { "DISPATCHER" })
    @DisplayName("Should return 200 OK when management user accesses management endpoints")
    public void dispatcherRole_CanAccessManagementEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/assignments/management-summary")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}