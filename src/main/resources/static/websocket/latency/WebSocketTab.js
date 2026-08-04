import {WebSocketService} from './WebSocketService.js';
import {Controls} from './components/Controls.js';
import {MetricsBox} from './components/MetricsBox.js';
import {Logger} from './components/Logger.js';
import {LatencyChart} from "./components/LatencyChart.js";

export class WebSocketTab {
    constructor() {
        this.service = null;
        this.chart = null;
        this.templateUrl = '/websocket/latency/websocket.html';
    }

    async render() {
        const response = await fetch(this.templateUrl);
        return await response.text();
    }

    init() {
        this.chart = new LatencyChart('ws-chart');

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
            clearBtn.addEventListener('click', () => {
                logger.clear();
                this.chart?.clear();
            });
        }

        this.service = new WebSocketService(
            isConnected => controls.setConnectedState(isConnected),
            metrics => {
                metricsBox.update(metrics);
                if (metrics.latency !== undefined && !isNaN(metrics.latency)) {
                    this.chart?.addValue(metrics.latency);
                }
            },
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