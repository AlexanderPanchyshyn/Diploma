export class Logger {
    constructor(logContainerId) {
        this.container = document.getElementById(logContainerId);
    }

    log(message) {
        if (!this.container) return;

        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const time = new Date().toLocaleTimeString();
        entry.textContent = `[${time}] ${message}`;

        this.container.appendChild(entry);
        this.container.scrollTop = this.container.scrollHeight;
    }

    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}