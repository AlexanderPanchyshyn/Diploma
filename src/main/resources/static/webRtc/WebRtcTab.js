import { BaseTab } from '../core/BaseTab.js';
import { WebRtcService } from './WebRtcService.js';

export class WebRtcTab extends BaseTab {
    constructor() {
        super();
    }

    init() {
        this.initTabUI(
            (onStatusChange, onMetricsUpdate, onLog) =>
                new WebRtcService(onStatusChange, onMetricsUpdate, onLog),
            'WebRTC'
        );
    }
}