export class MetricsBox {
    constructor({ latencyId, clientTimeId, serverTimeId }) {
        this.latencyEl = document.getElementById(latencyId);
        this.clientTimeEl = document.getElementById(clientTimeId);
        this.serverTimeEl = document.getElementById(serverTimeId);
    }

    update(data) {
        if (this.latencyEl && data.latency !== undefined) {
            this.latencyEl.textContent = data.latency;
        }
        if (this.clientTimeEl && data.clientTime) {
            this.clientTimeEl.textContent = data.clientTime;
        }
        if (this.serverTimeEl && data.serverTime) {
            this.serverTimeEl.textContent = data.serverTime;
        }
    }

    reset() {
        if (this.latencyEl) this.latencyEl.textContent = '0';
        if (this.clientTimeEl) this.clientTimeEl.textContent = '---';
        if (this.serverTimeEl) this.serverTimeEl.textContent = '---';
    }
}