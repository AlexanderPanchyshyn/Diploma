export class BaseClient {
    constructor(onStatusChange, onMetricsUpdate, onLog) {
        this.onStatusChange = onStatusChange;
        this.onMetricsUpdate = onMetricsUpdate;
        this.onLog = onLog;
    }

    connect() { throw new Error("Method connect() must be implemented"); }
    disconnect() { throw new Error("Method disconnect() must be implemented"); }
    sendPing() { throw new Error("Method sendPing() must be implemented"); }
}