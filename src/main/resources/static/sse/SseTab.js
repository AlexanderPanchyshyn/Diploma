import { BaseTab } from '../core/BaseTab.js';
import { SseService } from './SseService.js';

export class SseTab extends BaseTab {
    constructor() {
        super();
    }

    init() {
        this.initTabUI(
            (onStatusChange, onMetricsUpdate, onLog) =>
                new SseService(onStatusChange, onMetricsUpdate, onLog),
            'SSE'
        );
    }
}