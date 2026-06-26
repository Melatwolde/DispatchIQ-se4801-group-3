package com.dispatchiq.backend.websocket;

import com.dispatchiq.backend.api.dto.response.TelemetryUpdateResponse;
import com.dispatchiq.backend.service.TelemetryBroadcastService;
import com.dispatchiq.backend.service.TelemetryProcessingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class TelemetryWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(TelemetryWebSocketHandler.class);

    private final TelemetryProcessingService telemetryProcessingService;
    private final TelemetryBroadcastService broadcastService;
    private final ObjectMapper objectMapper;

    public TelemetryWebSocketHandler(
            TelemetryProcessingService telemetryProcessingService,
            TelemetryBroadcastService broadcastService,
            ObjectMapper objectMapper
    ) {
        this.telemetryProcessingService = telemetryProcessingService;
        this.broadcastService = broadcastService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String role = (String) session.getAttributes().get("role");
        if ("DISPATCHER".equals(role) || "ADMIN".equals(role) || "MANAGER".equals(role)) {
            broadcastService.registerDispatcher(session);
        }
        log.debug("Telemetry WebSocket connected: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            TelemetryUpdateResponse update = telemetryProcessingService.process(message.getPayload());
            String ack = objectMapper.writeValueAsString(update);
            synchronized (session) {
                session.sendMessage(new TextMessage(ack));
            }
        } catch (IllegalArgumentException e) {
            sendError(session, e.getMessage());
        } catch (Exception e) {
            log.error("Telemetry processing error", e);
            sendError(session, "Telemetry processing failed");
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        broadcastService.unregister(session);
    }

    private void sendError(WebSocketSession session, String error) {
        try {
            synchronized (session) {
                session.sendMessage(new TextMessage("{\"error\":\"" + error.replace("\"", "'") + "\"}"));
            }
        } catch (Exception ignored) {
        }
    }
}
