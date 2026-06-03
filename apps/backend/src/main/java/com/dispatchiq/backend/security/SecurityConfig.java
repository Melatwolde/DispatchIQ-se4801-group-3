package com.dispatchiq.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Enables @PreAuthorize support
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, AuthenticationProvider authenticationProvider) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.authenticationProvider = authenticationProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(
                                "/api/v1/auth/**",
                                "/auth/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/actuator/health"
                        ).permitAll()

                        // Admin-only: system config, audit logs, user management
                        .requestMatchers("/api/v1/admin/**", "/api/v1/audit/**").hasRole("ADMIN")

                        // Manager: analytics, performance reports (read-only)
                        .requestMatchers("/api/v1/performance/**", "/api/v1/analytics/**")
                            .hasAnyRole("MANAGER", "ADMIN")

                        // Dispatcher: assignment, fleet management, dispatch operations
                        .requestMatchers(
                                "/api/v1/dispatch/**",
                                "/api/v1/fleets/**",
                                "/api/v1/assignments/**"
                        ).hasAnyRole("DISPATCHER", "MANAGER", "ADMIN")

                        // Driver: accept/reject assignments, update status, view own deliveries
                        .requestMatchers("/api/v1/driver/**", "/api/v1/assignments/{id}/accept", "/api/v1/assignments/{id}/reject")
                            .hasRole("DRIVER")

                        .requestMatchers("/api/v1/deliveries/**")
                            .hasAnyRole("CUSTOMER", "DISPATCHER", "ADMIN") 

                
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allow Nx frontend domains
        configuration.setAllowedOrigins(List.of(
                "http://localhost:4200"
        ));
        
        configuration.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));
        
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "Idempotency-Key" 
        ));

        configuration.setExposedHeaders(List.of("Authorization"));
        
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}