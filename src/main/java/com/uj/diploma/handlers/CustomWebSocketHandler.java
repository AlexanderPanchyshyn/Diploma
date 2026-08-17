package com.uj.diploma.handlers;

import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

public class CustomWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        long serverTime = System.currentTimeMillis();

        JsonNode jsonNode = objectMapper.readTree(message.getPayload());

        long clientTime = jsonNode.get("clientTime").asLong();
        String batchId = jsonNode.has("batchId") ? jsonNode.get("batchId").asString() : "";
        int seq = jsonNode.has("seq") ? jsonNode.get("seq").asInt() : 1;
        int totalInBatch = jsonNode.has("totalInBatch") ? jsonNode.get("totalInBatch").asInt() : 1;

        long latency = serverTime - clientTime;

        String jsonResponse = String.format(
                "{\"batchId\":\"%s\", \"seq\":%d, \"totalInBatch\":%d, \"clientTime\":%d, \"serverTime\":%d, \"latency\":%d}",
                batchId, seq, totalInBatch, clientTime, serverTime, latency
        );

        session.sendMessage(new TextMessage(jsonResponse));
    }
}
