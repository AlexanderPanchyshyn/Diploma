import { BaseClient } from '../core/BaseClient.js';

export class WebSocketService extends BaseClient {
    constructor(onStatusChange, onMetricsUpdate, onLog) {
        super(onStatusChange, onMetricsUpdate, onLog);
        this.socket = null;
        this.isLossSimulationEnabled = false;
        this.lossRate = 0;
    }

    setLossSimulation(enabled, rate) {
        this.isLossSimulationEnabled = enabled;
        this.lossRate = rate;
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
            const currentTime = Date.now();
            const data = JSON.parse(event.data);

            if (this.isLossSimulationEnabled && (Math.random() * 100 < this.lossRate)) {
                if (this.batches[data.batchId]) {
                    const batch = this.batches[data.batchId];
                    batch.processedCount = (batch.processedCount || 0) + 1;

                    if (this.onMetricsUpdate) {
                        this.onMetricsUpdate({
                            isLoading: true,
                            receivedCount: batch.receivedCount,
                            total: batch.total
                        });
                    }

                    this.checkBatchCompletion(data.batchId, currentTime);
                }
                return;
            }

            if (data.batchId) {
                if (!this.batches[data.batchId]) {
                    this.batches[data.batchId] = {
                        receivedCount: 0,
                        processedCount: 0,
                        total: data.totalInBatch,
                        startTime: data.clientTime,
                        latencies: [],
                        timeoutId: null
                    };
                }

                const batch = this.batches[data.batchId];
                batch.receivedCount += 1;
                batch.processedCount = (batch.processedCount || 0) + 1;
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

                this.checkBatchCompletion(data.batchId, currentTime);
            }
        };

        this.socket.onerror = (error) => {
            this.onLog('WebSocket Error: ' + error);
        };

        this.socket.onclose = () => {
            this.onStatusChange(false);
            this.onLog('Successfully disconnected from WebSocket');
        };
    }

    checkBatchCompletion(batchId, receiveTime) {
        const batch = this.batches[batchId];
        if (!batch) return;

        if (batch.timeoutId) {
            clearTimeout(batch.timeoutId);
        }

        const finalize = () => {
            if (!this.batches[batchId]) return;

            const totalBatchTime = receiveTime - batch.startTime;
            const avgLatency = batch.latencies.length > 0
                ? Math.round(batch.latencies.reduce((a, b) => a + b, 0) / batch.latencies.length)
                : 0;

            this.onLog(`Sent: ${batch.total} pings | Received: ${batch.receivedCount} | Total Batch Time: ${totalBatchTime} ms | Avg Latency: ${avgLatency} ms`);

            if (this.onMetricsUpdate) {
                this.onMetricsUpdate({
                    isLoading: false,
                    allLatencies: batch.latencies,
                    batchSize: batch.total,
                    receivedCount: batch.receivedCount,
                    total: batch.total,
                    avgLatency: avgLatency
                });
            }

            delete this.batches[batchId];
        };

        if (batch.processedCount >= batch.total) {
            finalize();
        } else {
            batch.timeoutId = setTimeout(finalize, 5000);
        }
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