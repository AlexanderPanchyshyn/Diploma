export class LatencyChart {
    constructor(canvasId) {
        this.distribution = new Map();

        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        const wrapper = this.canvas.parentElement;
        if (wrapper) {
            const resizeObserver = new ResizeObserver(() => {
                this.resizeCanvas();
                this.draw();
            });
            resizeObserver.observe(wrapper);
        }

        this.resizeCanvas();
        this.draw();
    }

    resizeCanvas() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        if (!parent) return;

        const width = parent.clientWidth;
        const height = parent.clientHeight || 200;

        if (width > 0 && height > 0) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
    }

    addValue(latency) {
        if (!this.canvas || latency === undefined || isNaN(latency)) return;

        const lat = Math.max(0, Math.round(latency));
        const current = this.distribution.get(lat) || 0;
        this.distribution.set(lat, current + 1);
        this.draw();
    }

    clear() {
        this.distribution.clear();
        this.draw();
    }

    draw() {
        if (!this.canvas || !this.ctx) return;

        this.resizeCanvas();
        const width = this.canvas.width;
        const height = this.canvas.height;
        const padding = { top: 20, right: 20, bottom: 30, left: 40 };

        this.ctx.clearRect(0, 0, width, height);

        if (this.distribution.size === 0) return;

        const keys = Array.from(this.distribution.keys()).sort((a, b) => a - b);
        const maxFreq = Math.max(...this.distribution.values(), 1);

        const graphWidth = width - padding.left - padding.right;
        const graphHeight = height - padding.top - padding.bottom;

        const barWidth = Math.max(10, Math.floor(graphWidth / keys.length) - 6);

        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = '#666';
        this.ctx.font = '11px sans-serif';

        this.ctx.beginPath();
        this.ctx.moveTo(padding.left, height - padding.bottom);
        this.ctx.lineTo(width - padding.right, height - padding.bottom);
        this.ctx.stroke();

        keys.forEach((lat, index) => {
            const count = this.distribution.get(lat);
            const barHeight = (count / maxFreq) * graphHeight;

            const x = padding.left + index * (barWidth + 6) + 5;
            const y = height - padding.bottom - barHeight;

            this.ctx.fillStyle = '#3b82f6';
            this.ctx.fillRect(x, y, barWidth, barHeight);

            this.ctx.fillStyle = '#1e293b';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(count.toString(), x + barWidth / 2, y - 4);

            this.ctx.fillStyle = '#64748b';
            this.ctx.fillText(`${lat}ms`, x + barWidth / 2, height - padding.bottom + 15);
        });
    }
}