package com.uj.diploma.controllers;

import com.uj.diploma.services.SseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/sse")
@CrossOrigin(origins = "*")
public class SseController {

    private final SseService sseService;

    @Autowired
    public SseController(SseService sseService) {
        this.sseService = sseService;
    }

    @PostMapping("/ping")
    public SseEmitter handlePing(@RequestBody Map<String, Object> payload) {
        return sseService.handlePing(payload);
    }
}
