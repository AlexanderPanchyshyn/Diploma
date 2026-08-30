import { SseService } from './SseService.js';
import { Controls } from '../components/Controls.js';
import { MetricsBox } from '../components/MetricsBox.js';
import { Logger } from '../components/Logger.js';
import { LatencyChart } from '../components/LatencyChart.js';
import { JitterChart } from '../components/JitterChart.js';
import { PacketLossChart } from '../components/PacketLossChart.js';

export class SseTab {
    constructor() {
        this.service = null;
        this.latencyChart = null;
        this.jitterChart = null;
        this.packetLossChart = null;
        this.templateUrl = '/template/template.html';
    }

    async render() {
        const response = await fetch(this.templateUrl);
        return await response.text();
    }

    init() {
        this.latencyChart = new LatencyChart('ws-latency-chart');
        this.jitterChart = new JitterChart('ws-jitter-chart');
        this.packetLossChart = new PacketLossChart('ws-packet-loss-chart');

        const logger = new Logger('ws-log');
        const pingCountInput = document.getElementById('ws-ping-count');
        const lossCheckbox = document.getElementById('ws-simulate-loss');
        const lossInput = document.getElementById('ws-loss-rate');

        const metricsBox = new MetricsBox({
            clientTimeId: 'ws-client-time',
            serverTimeId: 'ws-server-time',
            latencyId: 'ws-latency',
            jitterId: 'ws-jitter',
            packetLossId: 'ws-packet-loss',
        });

        const controls = new Controls(
            {connectBtnId: 'ws-connect', disconnectBtnId: 'ws-disconnect', pingBtnId: 'ws-ping'},
            {
                onConnect: () => {
                    controls.setConnectedState(true);
                    logger.log('SSE connection initialized.');
                },
                onDisconnect: () => {
                    controls.setConnectedState(false);
                    logger.log('SSE connection closed.');
                },
                onPing: () => {
                    const count = parseInt(pingCountInput.value || '1', 10);

                    this.latencyChart?.clear();
                    this.jitterChart?.clear();
                    this.packetLossChart?.clear();

                    this.service?.sendPing(count);
                }
            }
        );

        const updateLossSettings = () => {
            const enabled = lossCheckbox?.checked || false;
            const rate = parseFloat(lossInput?.value) || 0;
            this.service?.setLossSimulation(enabled, rate);
        };

        if (lossCheckbox) lossCheckbox.addEventListener('change', updateLossSettings);
        if (lossInput) lossInput.addEventListener('input', updateLossSettings);

        const clearBtn = document.getElementById('ws-clear-logs');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                logger.clear();
                this.latencyChart?.clear();
                this.jitterChart?.clear();
                this.packetLossChart?.clear();
            });
        }

        this.service = new SseService({
            onStatusChange: isConnected => controls.setConnectedState(isConnected),
            onMetricsUpdate: metrics => {
                metricsBox.update(metrics);

                if (metrics.total && metrics.receivedCount !== undefined) {
                    this.packetLossChart?.setStats(metrics.total, metrics.receivedCount);
                }

                if (metrics.isLoading) {
                    this.latencyChart?.setLoading(true, metrics.receivedCount, metrics.total);
                } else if (metrics.allLatencies) {
                    this.latencyChart?.setLatencies(metrics.allLatencies);
                    this.jitterChart?.setLatencies(metrics.allLatencies);
                    this.setMaxJitter(metricsBox, metrics);
                }
            },
            onLog: message => logger.log(message)
        });

        updateLossSettings();
    }

    setMaxJitter(metricsBox, metrics) {
        let maxJitter = 0;
        const latencies = metrics.allLatencies;
        for (let i = 1; i < latencies.length; i++) {
            const jitter = Math.abs(latencies[i] - latencies[i - 1]);
            if (jitter > maxJitter) maxJitter = jitter;
        }
        metricsBox.update({ ...metrics, jitter: maxJitter });
    }

    destroy() {
        this.service = null;
    }
}