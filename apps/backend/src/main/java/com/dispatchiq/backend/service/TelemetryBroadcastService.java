package com.dispatchiq.backend.service;

import com.dispatchiq.backend.api.dto.response.TelemetryUpdateResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TelemetryBroadcastService {

    private final Set<WebSocketSession> dispatcherSessions = ConcurrentHashMap.newKeySet();
    private final ObjectMapper objectMapper;

    public TelemetryBroadcastService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void registerDispatcher(WebSocketSession session) {
        dispatcherSessions.add(session);
    }

    public void unregister(WebSocketSession session) {
        dispatcherSessions.remove(session);
    }

    public void broadcast(TelemetryUpdateResponse update) {
        String json;
        try {
            json = objectMapper.writeValueAsString(update);
        } catch (IOException e) {
            return;
        }

        TextMessage message = new TextMessage(json);
        for (WebSocketSession session : dispatcherSessions) {
            if (session.isOpen()) {
                try {
                    synchronized (session) {
                        session.sendMessage(message);
                    }
                } catch (IOException ignored) {
                    dispatcherSessions.remove(session);
                }
            }
        }
    }
}
