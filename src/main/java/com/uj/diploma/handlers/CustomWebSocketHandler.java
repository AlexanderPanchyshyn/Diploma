package com.uj.diploma.handlers;

import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

public class CustomWebSocketHandler extends TextWebSocketHandler {

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        long clientTimestamp = Long.parseLong(message.getPayload());
        long serverTimestamp = System.currentTimeMillis();
        long latency = serverTimestamp - clientTimestamp;

        String jsonResponse = String.format("{\"clientTimestamp\":%d, \"serverTimestamp\":%d, \"latency\":%d}",
                clientTimestamp, serverTimestamp, latency);

        session.sendMessage(new TextMessage(jsonResponse));
    }
}
