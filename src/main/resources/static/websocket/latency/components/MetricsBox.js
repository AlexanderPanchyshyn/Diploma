export class MetricsBox {
    constructor({ clientTimeId, serverTimeId, latencyId, jitterId }) {
        this.clientTimeEl = document.getElementById(clientTimeId);
        this.serverTimeEl = document.getElementById(serverTimeId);
        this.latencyEl = document.getElementById(latencyId);
        this.jitterEl = document.getElementById(jitterId);
    }

    update(data) {
        if (this.clientTimeEl && data.clientTime) {
            this.clientTimeEl.textContent = data.clientTime;
        }
        if (this.serverTimeEl && data.serverTime) {
            this.serverTimeEl.textContent = data.serverTime;
        }
        if (this.latencyEl && data.latency !== undefined) {
            this.latencyEl.textContent = data.latency;
        }
        if (this.jitterEl && data.jitter !== undefined) {
            this.jitterEl.textContent = data.jitter;
        }
    }
}