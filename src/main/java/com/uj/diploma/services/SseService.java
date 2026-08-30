package com.uj.diploma.services;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class SseService {

    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SseEmitter handlePing(Map<String, Object> payload) {
        SseEmitter emitter = new SseEmitter(0L);

        executor.execute(() -> {
            try {
                int count = (int) payload.getOrDefault("count", 1);
                String batchId = (String) payload.getOrDefault("batchId", "");
                long clientTime = ((Number) payload.get("clientTime")).longValue();

                for (int i = 0; i < count; i++) {
                    long serverTime = System.currentTimeMillis();
                    long latency = serverTime - clientTime;
                    int sequence = i + 1;

                    Map<String, Object> response = createResponse(batchId, sequence, count, clientTime, serverTime, latency);

                    sendEvent(response, emitter);
                }
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    private Map<String, Object> createResponse(String batchId, int sequence, int count, long clientTime, long serverTime, long latency) {
        Map<String, Object> response = new HashMap<>();

        response.put("batchId", batchId);
        response.put("seq", sequence);
        response.put("totalInBatch", count);
        response.put("clientTime", clientTime);
        response.put("serverTime", serverTime);
        response.put("latency", latency);

        return response;
    }

    private void sendEvent(Map<String, Object> response, SseEmitter emitter) throws IOException {
        emitter.send(SseEmitter.event()
                .name("ping-response")
                .data(objectMapper.writeValueAsString(response), MediaType.APPLICATION_JSON));
    }
}
