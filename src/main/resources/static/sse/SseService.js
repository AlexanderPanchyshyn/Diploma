import { BaseClient } from '../core/BaseClient.js';

export class SseService extends BaseClient {
    constructor({ onStatusChange, onMetricsUpdate, onLog }) {
        super(onStatusChange, onMetricsUpdate, onLog);
        this.batches = {};
        this.isLossSimulationEnabled = false;
        this.lossRate = 0;
    }

    setLossSimulation(enabled, rate) {
        this.isLossSimulationEnabled = enabled;
        this.lossRate = rate;
    }

    formatTime(timestamp) {
        const numericTimestamp = Number(timestamp);
        if (!timestamp || isNaN(numericTimestamp)) return '---';
        const date = new Date(numericTimestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const millis = String(date.getMilliseconds()).padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${millis}`;
    }

    sendPing(count = 1) {
        const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const startTime = Date.now();

        this.batches[batchId] = {
            receivedCount: 0,
            processedCount: 0,
            total: count,
            startTime: startTime,
            latencies: [],
            timeoutId: null
        };

        fetch('/sse/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                batchId: batchId,
                count: count,
                clientTime: startTime
            })
        }).then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            const readChunk = () => {
                reader.read().then(({ done, value }) => {
                    if (done) return;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop(); // зберігаємо незавершений шматочок

                    lines.forEach(line => {
                        const dataLine = line.split('\n').find(l => l.startsWith('data:'));
                        if (dataLine) {
                            const jsonStr = dataLine.replace('data:', '').trim();
                            if (jsonStr) {
                                this.handleMessage(JSON.parse(jsonStr));
                            }
                        }
                    });

                    readChunk();
                });
            };

            readChunk();
        }).catch(err => {
            if (this.onLog) this.onLog(`SSE Error: ${err.message}`);
        });
    }

    handleMessage(data) {
        const currentTime = Date.now();

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

        if (data.batchId && this.batches[data.batchId]) {
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
    }

    checkBatchCompletion(batchId, receiveTime) {
        const batch = this.batches[batchId];
        if (!batch) return;

        if (batch.timeoutId) clearTimeout(batch.timeoutId);

        const finalize = () => {
            if (!this.batches[batchId]) return;

            const totalBatchTime = receiveTime - batch.startTime;
            const avgLatency = batch.latencies.length > 0
                ? Math.round(batch.latencies.reduce((a, b) => a + b, 0) / batch.latencies.length)
                : 0;

            if (this.onLog) {
                this.onLog(`[SSE] Sent: ${batch.total} pings | Received: ${batch.receivedCount} | Total Batch Time: ${totalBatchTime} ms | Avg Latency: ${avgLatency} ms`);
            }

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
}