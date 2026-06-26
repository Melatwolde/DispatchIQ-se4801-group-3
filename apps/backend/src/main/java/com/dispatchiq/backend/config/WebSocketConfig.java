package com.dispatchiq.backend.config;

import com.dispatchiq.backend.websocket.TelemetryHandshakeInterceptor;
import com.dispatchiq.backend.websocket.TelemetryWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final TelemetryWebSocketHandler telemetryWebSocketHandler;
    private final TelemetryHandshakeInterceptor handshakeInterceptor;

    public WebSocketConfig(
            TelemetryWebSocketHandler telemetryWebSocketHandler,
            TelemetryHandshakeInterceptor handshakeInterceptor
    ) {
        this.telemetryWebSocketHandler = telemetryWebSocketHandler;
        this.handshakeInterceptor = handshakeInterceptor;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(telemetryWebSocketHandler, "/ws/telemetry")
                .addInterceptors(handshakeInterceptor)
                .setAllowedOrigins(
                        "http://localhost:3000",
                        "http://127.0.0.1:3000",
                        "http://localhost:4200",
                        "http://127.0.0.1:4200"
                );
    }
}
