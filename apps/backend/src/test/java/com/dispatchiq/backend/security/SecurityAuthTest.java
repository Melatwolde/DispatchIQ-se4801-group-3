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

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityAuthTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Should return 401 Unauthorized when accessing protected endpoints without credentials")
    public void unauthenticatedUsers_AreDeniedAccess() throws Exception {
        mockMvc.perform(get("/api/v1/assignments")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "driver_user", roles = { "DRIVER" })
    @DisplayName("Should return 200 OK when authenticated user accesses permitted endpoint")
    public void authenticatedUsers_CanAccessPermittedEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/assignments")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "unauthorized_driver", roles = { "DRIVER" })
    @DisplayName("Should return 403 Forbidden when user lacks the required management role")
    public void driverRole_CannotAccessManagementEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/assignments/management-summary")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "dispatcher_user", roles = { "DISPATCHER" })
    @DisplayName("Should return 200 OK when management user accesses management endpoints")
    public void dispatcherRole_CanAccessManagementEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/assignments/management-summary")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}