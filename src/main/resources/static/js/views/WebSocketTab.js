import { WebSocketService } from '../services/WebSocketService.js';
import { Controls } from '../components/Controls.js';
import { MetricsBox } from '../components/MetricsBox.js';
import { Logger } from '../components/Logger.js';

export class WebSocketTab {
    constructor() {
        this.service = null;
        this.templateUrl = '/templates/websocket.html';
    }

    async render() {
        const response = await fetch(this.templateUrl);
        return await response.text();
    }

    init() {
        const logger = new Logger('ws-log');
        const metricsBox = new MetricsBox({
            latencyId: 'ws-latency',
            clientTimeId: 'ws-client-time',
            serverTimeId: 'ws-server-time'
        });

        const controls = new Controls(
            { connectBtnId: 'ws-connect', disconnectBtnId: 'ws-disconnect', pingBtnId: 'ws-ping' },
            {
                onConnect: () => this.service?.connect(),
                onDisconnect: () => this.service?.disconnect(),
                onPing: () => this.service?.sendPing()
            }
        );

        const clearBtn = document.getElementById('ws-clear-logs');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => logger.clear());
        }

        this.service = new WebSocketService(
            isConnected => controls.setConnectedState(isConnected),
            metrics => metricsBox.update(metrics),
            message => logger.log(message)
        );
    }

    destroy() {
        if (this.service) {
            this.service.disconnect();
            this.service = null;
        }
    }
}