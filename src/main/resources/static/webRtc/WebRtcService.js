import { BaseClient } from '../core/BaseClient.js';

export class WebRtcService extends BaseClient {
    constructor(onStatusChange, onMetricsUpdate, onLog) {
        super(onStatusChange, onMetricsUpdate, onLog);
        this.peerConnection = null;
        this.dataChannel = null;
    }

    async connect() {
        try {
            this.peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            this.dataChannel = this.peerConnection.createDataChannel('ping-pong-channel');

            this.dataChannel.onopen = () => {
                this.onStatusChange(true);
                this.onLog('Successfully connected to WebRTC');
            }

            this.dataChannel.onclose = () => {
                this.onStatusChange(false);
                this.onLog('Successfully disconnected from WebRTC');
            }

            this.dataChannel.onerror = (error) => console.log(error);

            this.dataChannel.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data);
                    this.handleIncomingData(response);
                } catch (e) {
                    console.error('Failed to parse WebRTC message:', e);
                }
            };

            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            const response = await fetch('/webrtc/ping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: offer.type,
                    sdp: offer.sdp
                })
            });

            const answerDto = await response.json();

            if (answerDto && answerDto.sdp) {
                await this.peerConnection.setRemoteDescription(
                    new RTCSessionDescription({
                        type: answerDto.type,
                        sdp: answerDto.sdp
                    })
                );
            }
        } catch (error) {
            console.error('WebRTC connection failed:', error);
            this.onStatusChange('error');
        }
    }

    disconnect() {
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        if (this.onStatusChange) {
            this.onStatusChange(false);
        }
    }

    sendPing(count = 1) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const startTime = Date.now();

            for (let i = 0; i < count; i++) {
                const payload = JSON.stringify({
                    batchId: batchId,
                    seq: i + 1,
                    totalInBatch: count,
                    clientTime: startTime
                });

                this.dataChannel.send(payload);
            }
        } else {
            console.warn('Cannot send ping: DataChannel is not open.');
        }
    }
}