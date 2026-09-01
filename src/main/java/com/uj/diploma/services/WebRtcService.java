package com.uj.diploma.services;

import com.uj.diploma.dtos.WebRtcMessageDto;
import com.uj.diploma.dtos.WebRtcSignalDto;
import dev.onvoid.webrtc.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CompletableFuture;

@Service
public class WebRtcService {
    private static final Logger log = LoggerFactory.getLogger(WebRtcService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final PeerConnectionFactory factory;

    public WebRtcService() {
        this.factory = new PeerConnectionFactory();
    }

    public WebRtcSignalDto processOfferAndCreateAnswer(WebRtcSignalDto offerDto) {
        RTCConfiguration config = new RTCConfiguration();
        RTCIceServer iceServer = new RTCIceServer();
        iceServer.urls.add("stun:stun.l.google.com:19302");
        config.iceServers.add(iceServer);

        CompletableFuture<WebRtcSignalDto> futureAnswer = new CompletableFuture<>();

        final RTCPeerConnection[] peerConnectionHolder = new RTCPeerConnection[1];

        PeerConnectionObserver observer = new PeerConnectionObserver() {
            @Override
            public void onDataChannel(RTCDataChannel dataChannel) {
                dataChannel.registerObserver(new RTCDataChannelObserver() {
                    @Override
                    public void onBufferedAmountChange(long previousAmount) {}

                    @Override
                    public void onStateChange() {
                        log.info("DataChannel state changed to: {}", dataChannel.getState().name());
                    }

                    @Override
                    public void onMessage(RTCDataChannelBuffer buffer) {
                        ByteBuffer byteBuffer = buffer.data;
                        byte[] bytes = new byte[byteBuffer.remaining()];
                        byteBuffer.get(bytes);
                        String rawMessage = new String(bytes, StandardCharsets.UTF_8);

                        String responseJson = handleDataChannelMessage(rawMessage);

                        if (responseJson != null) {
                            ByteBuffer responseBuffer = ByteBuffer.wrap(responseJson.getBytes(StandardCharsets.UTF_8));
                            try {
                                dataChannel.send(new RTCDataChannelBuffer(responseBuffer, false));
                            } catch (Exception e) {
                                log.error("Error sending response via DataChannel", e);
                            }
                        }
                    }
                });
            }

            @Override
            public void onIceCandidate(RTCIceCandidate candidate) {}

            @Override
            public void onIceGatheringChange(RTCIceGatheringState state) {
                if (state == RTCIceGatheringState.COMPLETE) {
                    if (peerConnectionHolder[0] != null) {
                        RTCSessionDescription localDesc = peerConnectionHolder[0].getLocalDescription();
                        if (localDesc != null) {
                            WebRtcSignalDto answerDto = new WebRtcSignalDto();
                            answerDto.setType("answer");
                            answerDto.setSdp(localDesc.sdp);
                            futureAnswer.complete(answerDto);
                        }
                    }
                }
            }
        };

        RTCPeerConnection peerConnection = factory.createPeerConnection(config, observer);
        peerConnectionHolder[0] = peerConnection;

        RTCSessionDescription offerDescription = new RTCSessionDescription(
                RTCSdpType.OFFER,
                offerDto.getSdp()
        );
        peerConnection.setRemoteDescription(offerDescription, new SetSessionDescriptionObserver() {
            @Override public void onSuccess() {}
            @Override public void onFailure(String error) {
                futureAnswer.completeExceptionally(new RuntimeException("Set Remote SDP failed: " + error));
            }
        });

        RTCAnswerOptions options = new RTCAnswerOptions();
        peerConnection.createAnswer(options, new CreateSessionDescriptionObserver() {
            @Override
            public void onSuccess(RTCSessionDescription description) {
                peerConnection.setLocalDescription(description, new SetSessionDescriptionObserver() {
                    @Override public void onSuccess() {
                        log.info("Local description set successfully. Waiting for ICE gathering...");
                    }
                    @Override public void onFailure(String error) {
                        futureAnswer.completeExceptionally(new RuntimeException("Set Local SDP failed: " + error));
                    }
                });
            }

            @Override
            public void onFailure(String error) {
                futureAnswer.completeExceptionally(new RuntimeException("Set Local SDP failed: " + error));
            }
        });

        try {
            return futureAnswer.get(5, java.util.concurrent.TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Failed to process offer", e);
            return null;
        }
    }

    public String handleDataChannelMessage(String rawPayload) {
        try {
            long serverTime = System.currentTimeMillis();
            JsonNode jsonNode = objectMapper.readTree(rawPayload);

            long clientTime = jsonNode.get("clientTime").asLong();
            String batchId = jsonNode.has("batchId") ? jsonNode.get("batchId").asString() : "";
            int seq = jsonNode.has("seq") ? jsonNode.get("seq").asInt() : 1;
            int totalInBatch = jsonNode.has("totalInBatch") ? jsonNode.get("totalInBatch").asInt() : 1;

            long latency = Math.max(serverTime - clientTime, 0);

            WebRtcMessageDto responseDto = new WebRtcMessageDto(batchId, seq, totalInBatch, clientTime, serverTime, latency);

            return objectMapper.writeValueAsString(responseDto);
        } catch (Exception e) {
            log.error("e: ", e);
            return null;
        }
    }
}