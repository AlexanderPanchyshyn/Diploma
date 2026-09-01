package com.uj.diploma.controllers;

import com.uj.diploma.dtos.WebRtcSignalDto;
import com.uj.diploma.services.WebRtcService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/webrtc")
public class WebRtcController {

    private final WebRtcService webRtcService;

    public WebRtcController(WebRtcService webRtcService) {
        this.webRtcService = webRtcService;
    }

    @PostMapping("/ping")
    public ResponseEntity<WebRtcSignalDto> handlePing(@RequestBody WebRtcSignalDto signal) {
        if ("offer".equalsIgnoreCase(signal.getType())) {
            WebRtcSignalDto answer = webRtcService.processOfferAndCreateAnswer(signal);
            return ResponseEntity.ok(answer);
        }
        return ResponseEntity.ok().build();
    }
}