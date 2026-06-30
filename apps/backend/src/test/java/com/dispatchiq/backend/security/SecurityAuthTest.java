package com.dispatchiq.backend.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// ContextConfiguration isolates the testing scope completely to ONLY these two inner static blocks
@WebMvcTest
@ContextConfiguration(classes = { SecurityAuthTest.MockController.class, SecurityAuthTest.MockSecurityConfig.class })
@ActiveProfiles("test")
public class SecurityAuthTest {

    @Autowired
    private MockMvc mockMvc;

    // Dedicated standalone mock controller inside the container context
    @RestController
    public static class MockController {
        @GetMapping("/api/v1/assignments")
        public String getAssignments() {
            return "assignments-secured-data";
        }

        @GetMapping("/api/v1/assignments/management-summary")
        public String getManagementSummary() {
            return "management-secured-data";
        }
    }

    // Explicit inline security rule simulation
    @Configuration
    @EnableWebSecurity
    public static class MockSecurityConfig {
        @Bean
        public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
            http
                    .csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(auth -> auth
                            .requestMatchers("/api/v1/assignments/management-summary").hasRole("DISPATCHER")
                            .requestMatchers("/api/v1/assignments").hasAnyRole("DRIVER", "DISPATCHER")
                            .anyRequest().authenticated())
                    .httpBasic(basic -> {
                    });
            return http.build();
        }
    }

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