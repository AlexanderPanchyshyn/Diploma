import { BaseTab } from '../core/BaseTab.js';
import { WebSocketService } from './WebSocketService.js';

export class WebSocketTab extends BaseTab {
    constructor() {
        super();
    }

    init() {
        this.initTabUI(
            (onStatusChange, onMetricsUpdate, onLog) =>
                new WebSocketService(onStatusChange, onMetricsUpdate, onLog),
            'WebSocket'
        );
    }
}