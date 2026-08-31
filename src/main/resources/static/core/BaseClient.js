export class BaseClient {
    constructor(onStatusChange, onMetricsUpdate, onLog) {
        this.onStatusChange = onStatusChange;
        this.onMetricsUpdate = onMetricsUpdate;
        this.onLog = onLog;

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

    handleIncomingData(data) {
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

        if (data.batchId) {
            if (!this.batches[data.batchId]) {
                this.batches[data.batchId] = {
                    receivedCount: 0,
                    processedCount: 0,
                    total: data.totalInBatch || 1,
                    startTime: data.clientTime || currentTime,
                    latencies: [],
                    timeoutId: null,
                    lastClientTime: null,
                    lastServerTime: null
                };
            }

            const batch = this.batches[data.batchId];
            batch.receivedCount += 1;
            batch.processedCount = (batch.processedCount || 0) + 1;
            batch.latencies.push(data.latency);
            batch.lastClientTime = data.clientTime;
            batch.lastServerTime = data.serverTime;

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
                    avgLatency: avgLatency,
                    clientTime: this.formatTime(batch.lastClientTime),
                    serverTime: this.formatTime(batch.lastServerTime)
                });
            }

            delete this.batches[batchId];
        };

        if (batch.processedCount >= batch.total) {
            finalize();
        } else {
            batch.timeoutId = setTimeout(finalize, 2000);
        }
    }

    sendPing() { throw new Error("Method sendPing() must be implemented"); }
}