import { BaseService } from '../core/BaseService.js';

export class WebSocketService extends BaseService {
    constructor(onStatusChange, onMetricsUpdate, onLog) {
        super(onStatusChange, onMetricsUpdate, onLog);
        this.socket = null;
    }

    connect() {
        const host = window.location.host;
        this.socket = new WebSocket(`ws://${host}/websocket`);

        this.socket.onopen = () => {
            this.onStatusChange(true);
            this.onLog('Successfully connected to WebSocket');
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleIncomingData(data);
        };

        this.socket.onerror = (error) => {
            this.onLog('WebSocket Error: ' + error);
        };

        this.socket.onclose = () => {
            this.onStatusChange(false);
            this.onLog('Successfully disconnected from WebSocket');
        };
    }

    sendPing(count = 1) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const startTime = Date.now();

            for (let i = 0; i < count; i++) {
                const payload = JSON.stringify({
                    batchId: batchId,
                    seq: i + 1,
                    totalInBatch: count,
                    clientTime: startTime
                });
                this.socket.send(payload);
            }
        }
    }

    disconnect() {
        if (this.socket) this.socket.close();
    }
}