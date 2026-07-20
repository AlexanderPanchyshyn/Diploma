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

        //TODO find smth for logging (Log4j)
        System.out.println("Latency: " + latency);

        session.sendMessage(new TextMessage("Echo: " + clientTimestamp));
    }
}
