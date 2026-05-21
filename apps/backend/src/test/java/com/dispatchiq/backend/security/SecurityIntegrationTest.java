package com.dispatchiq.backend.security;

import com.dispatchiq.backend.api.dto.request.LoginRequest;
import com.dispatchiq.backend.api.dto.request.RegisterRequest;
import com.dispatchiq.backend.entity.Role;
import com.dispatchiq.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ActiveProfiles;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void shouldRegisterUserAndReturnTokens() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("dispatcher@dispatchiq.com");
        request.setPassword("securePassword");
        request.setFullName("Test Dispatcher");
        request.setPhone("1234567890");
        request.setRole(Role.DISPATCHER);

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void shouldLoginAndAccessSecuredEndpoint() throws Exception {
        // 1. Register Dispatcher
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("dispatcher2@dispatchiq.com");
        registerRequest.setPassword("securePass");
        registerRequest.setFullName("Test Dispatcher 2");
        registerRequest.setPhone("0987654321");
        registerRequest.setRole(Role.DISPATCHER);

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        // 2. Login
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("dispatcher2@dispatchiq.com");
        loginRequest.setPassword("securePass");

        String response = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // Extract token manually from JSON
        String token = objectMapper.readTree(response).get("accessToken").asText();

        // 3. Access Route requiring DISPATCHER role
        mockMvc.perform(get("/dispatch")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturn401WithoutToken() throws Exception {
        mockMvc.perform(get("/dispatch"))
                .andExpect(status().isUnauthorized()); // Could also be 403 based on Spring Security version defaults, let's test for unauthorized or forbidden. But typically 403 if authenticated but lacking role, 401 if unauthenticated. Actually stateless filter does not auto-return 401 if not configured with AuthenticationEntryPoint.
    }

    @Test
    void shouldFailRoleCheck() throws Exception {
        // Register DRIVER trying to access DISPATCHER route
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("driver@dispatchiq.com");
        registerRequest.setPassword("pass");
        registerRequest.setFullName("Driver");
        registerRequest.setRole(Role.DRIVER);

        String response = mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(response).get("accessToken").asText();

        mockMvc.perform(get("/dispatch")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}
