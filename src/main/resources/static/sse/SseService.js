import { BaseService } from '../core/BaseService.js';

export class SseService extends BaseService {
    constructor(onStatusChange, onMetricsUpdate, onLog) {
        super(onStatusChange, onMetricsUpdate, onLog);
    }

    sendPing(count = 1) {
        const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const startTime = Date.now();

        fetch('/sse/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                batchId: batchId,
                count: count,
                clientTime: startTime
            })
        }).then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            const readChunk = () => {
                reader.read().then(({ done, value }) => {
                    if (done) return;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop();

                    lines.forEach(line => {
                        const dataLine = line.split('\n').find(l => l.startsWith('data:'));
                        if (dataLine) {
                            const jsonStr = dataLine.replace('data:', '').trim();
                            if (jsonStr) {
                                this.handleIncomingData(JSON.parse(jsonStr));
                            }
                        }
                    });

                    readChunk();
                });
            };

            readChunk();
        }).catch(err => {
            if (this.onLog) this.onLog(`SSE Error: ${err.message}`);
        });
    }
}