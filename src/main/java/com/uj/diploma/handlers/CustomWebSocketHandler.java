package com.uj.diploma.handlers;

import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

public class CustomWebSocketHandler extends TextWebSocketHandler {

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        long clientTime = Long.parseLong(message.getPayload());
        long serverTime = System.currentTimeMillis();
        long latency = serverTime - clientTime;

        String jsonResponse = String.format("{\"clientTime\":%d, \"serverTime\":%d, \"latency\":%d}",
                clientTime, serverTime, latency);

        session.sendMessage(new TextMessage(jsonResponse));
    }
}
