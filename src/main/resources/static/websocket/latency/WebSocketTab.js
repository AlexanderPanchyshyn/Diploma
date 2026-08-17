import {WebSocketService} from './WebSocketService.js';
import {Controls} from './components/Controls.js';
import {MetricsBox} from './components/MetricsBox.js';
import {Logger} from './components/Logger.js';
import {LatencyChart} from "./components/LatencyChart.js";
import {JitterChart} from './components/JitterChart.js';

export class WebSocketTab {
    constructor() {
        this.service = null;
        this.latencyChart = null;
        this.jitterChart = null;
        this.templateUrl = '/websocket/latency/websocket.html';
    }

    async render() {
        const response = await fetch(this.templateUrl);
        return await response.text();
    }

    init() {
        this.latencyChart = new LatencyChart('ws-latency-chart');
        this.jitterChart = new JitterChart('ws-jitter-chart');

        const logger = new Logger('ws-log');

        const pingCountInput = document.getElementById('ws-ping-count');

        const metricsBox = new MetricsBox({
            clientTimeId: 'ws-client-time',
            serverTimeId: 'ws-server-time',
            latencyId: 'ws-latency',
            jitterId: 'ws-jitter'
        });

        const controls = new Controls(
            { connectBtnId: 'ws-connect', disconnectBtnId: 'ws-disconnect', pingBtnId: 'ws-ping' },
            {
                onConnect: () => this.service?.connect(),
                onDisconnect: () => this.service?.disconnect(),
                onPing: () => {
                    const count = parseInt(pingCountInput?.value || '1', 10);

                    this.latencyChart?.clear();

                    this.service?.sendPing(count)
                }
            }
        );

        const clearBtn = document.getElementById('ws-clear-logs');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                logger.clear();
                this.latencyChart?.clear();
                this.jitterChart?.clear();
            });
        }

        this.service = new WebSocketService(
            isConnected => controls.setConnectedState(isConnected),
            metrics => {
                metricsBox.update(metrics);
                if (metrics.isLoading) {
                    this.latencyChart?.setLoading(true, metrics.receivedCount, metrics.total);
                } else if (metrics.allLatencies) {
                    this.latencyChart?.setLatencies(metrics.allLatencies);
                    this.jitterChart?.setLatencies(metrics.allLatencies);

                    this.setMaxJitter(metricsBox, metrics);
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

    setMaxJitter(metricsBox, metrics) {
        let maxJitter = 0;
        const latencies = metrics.allLatencies;

        for (let i = 1; i < latencies.length; i++) {
            const jitter = Math.abs(latencies[i] - latencies[i - 1]);
            if (jitter > maxJitter) {
                maxJitter = jitter;
            }
        }

        metricsBox.update({
            ...metrics,
            jitter: maxJitter
        });
    }
}