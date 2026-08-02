export class Controls {
    constructor({ connectBtnId, disconnectBtnId, pingBtnId }, handlers) {
        this.connectBtn = document.getElementById(connectBtnId);
        this.disconnectBtn = document.getElementById(disconnectBtnId);
        this.pingBtn = document.getElementById(pingBtnId);

        if (this.connectBtn && handlers.onConnect) {
            this.connectBtn.addEventListener('click', handlers.onConnect);
        }
        if (this.disconnectBtn && handlers.onDisconnect) {
            this.disconnectBtn.addEventListener('click', handlers.onDisconnect);
        }
        if (this.pingBtn && handlers.onPing) {
            this.pingBtn.addEventListener('click', handlers.onPing);
        }
    }

    setConnectedState(isConnected) {
        if (this.connectBtn) this.connectBtn.disabled = isConnected;
        if (this.disconnectBtn) this.disconnectBtn.disabled = !isConnected;
        if (this.pingBtn) this.pingBtn.disabled = !isConnected;
    }
}