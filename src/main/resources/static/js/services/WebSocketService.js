import { BaseClient } from '../core/BaseClient.js';

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

        this.socket.onopen = () => {
            this.onStatusChange(true);
            this.onLog('Successfully connected to WebSocket');
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            const clientFormatted = this.formatTime(data.clientTime);
            const serverFormatted = this.formatTime(data.serverTime);

            this.onMetricsUpdate({
                latency: data.latency,
                clientTime: clientFormatted,
                serverTime: serverFormatted
            });

            this.onLog(`Client: ${clientFormatted} | Server: ${serverFormatted} | Latency: ${data.latency} ms`);
        };

        this.socket.onerror = (error) => {
            this.onLog('WebSocket Error: ' + error);
        };

        this.socket.onclose = () => {
            this.onStatusChange(false);
            this.onLog('Successfully disconnected from WebSocket');
        };
    }

    sendPing() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(Date.now().toString());
        }
    }

    disconnect() {
        if (this.socket) this.socket.close();
    }
}