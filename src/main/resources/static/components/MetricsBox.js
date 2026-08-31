export class MetricsBox {
    constructor({ clientTimeId, serverTimeId, latencyId, jitterId, packetLossId }) {
        this.clientTimeEl = document.getElementById(clientTimeId);
        this.serverTimeEl = document.getElementById(serverTimeId);
        this.latencyEl = document.getElementById(latencyId);
        this.jitterEl = document.getElementById(jitterId);
        this.packetLossEl = document.getElementById(packetLossId);
    }

    update(data) {
        if (this.clientTimeEl && data.clientTime !== undefined) {
            this.clientTimeEl.textContent = data.clientTime;
        }
        if (this.serverTimeEl && data.serverTime !== undefined) {
            this.serverTimeEl.textContent = data.serverTime;
        }
        if (this.latencyEl && data.latency !== undefined) {
            this.latencyEl.textContent = data.latency;
        }
        if (this.jitterEl && data.maxJitter !== undefined) {
            this.jitterEl.textContent = data.maxJitter;
        }

        if (this.packetLossEl && data.total && data.receivedCount !== undefined) {
            const lost = data.total - data.receivedCount;
            const percentage = ((lost / data.total) * 100).toFixed(2);
            this.packetLossEl.textContent = `${lost.toLocaleString()} (${percentage}%)`;
        }
    }
}