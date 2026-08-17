import { BaseClient } from '../../core/BaseClient.js';

export class WebSocketService extends BaseClient {
    constructor(onStatusChange, onMetricsUpdate, onLog) {
        super(onStatusChange, onMetricsUpdate, onLog);
        this.socket = null;
    }

    formatTime(timestamp) {
        const numericTimestamp = Number(timestamp);

        if (!timestamp || isNaN(numericTimestamp)) {
            return '---';
        }

        const date = new Date(numericTimestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const millis = String(date.getMilliseconds()).padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${millis}`;
    }

    connect() {
        const host = window.location.host;
        this.socket = new WebSocket(`ws://${host}/websocket`);

        this.batches = this.batches || {};

        this.socket.onopen = () => {
            this.onStatusChange(true);
            this.onLog('Successfully connected to WebSocket');
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const receiveTime = Date.now();

            if (data.batchId) {
                if (!this.batches[data.batchId]) {
                    this.batches[data.batchId] = {
                        receivedCount: 0,
                        total: data.totalInBatch,
                        startTime: data.clientTime,
                        latencies: []
                    };
                }

                const batch = this.batches[data.batchId];
                batch.receivedCount += 1;
                batch.latencies.push(data.latency);

                if (this.onMetricsUpdate) {
                    this.onMetricsUpdate({
                        isLoading: true,
                        receivedCount: batch.receivedCount,
                        total: batch.total,
                        clientTime: this.formatTime(data.clientTime),
                        serverTime: this.formatTime(data.serverTime),
                        latency: data.latency
                    });
                }

                if (batch.receivedCount === batch.total) {
                    const totalBatchDuration = receiveTime - batch.startTime;
                    const avgLatency = Math.round(
                        batch.latencies.reduce((a, b) => a + b, 0) / batch.total
                    );

                    this.onLog(`Sent: ${batch.total} pings | Total Batch Time: ${totalBatchDuration} ms | Avg Latency: ${avgLatency} ms`);

                    if (this.onMetricsUpdate) {
                        this.onMetricsUpdate({
                            isLoading: false,
                            allLatencies: batch.latencies,
                            batchSize: batch.total,
                            avgLatency: avgLatency,
                            clientTime: this.formatTime(data.clientTime),
                            serverTime: this.formatTime(data.serverTime),
                            latency: data.latency
                        });
                    }

                    delete this.batches[data.batchId];
                }
            }
        }

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