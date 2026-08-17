export class JitterChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.jitters = [];
    }

    setLatencies(latencies) {
        if (!latencies || latencies.length < 2) {
            this.jitters = [];
            this.draw();
            return;
        }

        this.jitters = [];
        for (let i = 1; i < latencies.length; i++) {
            const jitter = Math.abs(latencies[i] - latencies[i - 1]);
            this.jitters.push(jitter);
        }

        this.draw();
    }

    clear() {
        this.jitters = [];
        this.draw();
    }

    draw() {
        const padding = { top: 35, right: 25, bottom: 40, left: 50 };
        const width = this.canvas.width = this.canvas.parentElement.clientWidth;
        const height = this.canvas.height = 240;

        this.ctx.clearRect(0, 0, width, height);

        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const maxJitter = Math.max(...this.jitters, 1);
        const avgJitter = Math.round(this.jitters.reduce((a, b) => a + b, 0) / this.jitters.length);

        this.ctx.fillStyle = '#444';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.fillText(`Pings: ${this.jitters.length + 1} | Max Jitter: ${maxJitter} ms | Avg Jitter: ${avgJitter} ms`, padding.left, 18);

        this.ctx.lineWidth = 1;
        const ySteps = 4;
        for (let i = 0; i <= ySteps; i++) {
            const val = Math.round((maxJitter / ySteps) * i);
            const y = padding.top + chartHeight - (i / ySteps) * chartHeight;

            this.ctx.strokeStyle = '#e0e0e0';
            this.ctx.beginPath();
            this.ctx.moveTo(padding.left, y);
            this.ctx.lineTo(padding.left + chartWidth, y);
            this.ctx.stroke();

            this.ctx.fillStyle = '#666';
            this.ctx.font = '10px sans-serif';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${val} ms`, padding.left - 6, y + 3);
        }

        const stepX = chartWidth / Math.max(this.jitters.length - 1, 1);
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#666';

        const xTickInterval = Math.ceil(this.jitters.length / 10);
        this.jitters.forEach((_, index) => {
            if (index % xTickInterval === 0 || index === this.jitters.length - 1) {
                const x = padding.left + index * stepX;
                this.ctx.fillText(`#${index + 1}`, x, height - padding.bottom + 15);
            }
        });

        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 10px sans-serif';
        this.ctx.fillText('Packet Sequence (#)', padding.left + chartWidth / 2, height - 8);

        this.ctx.beginPath();
        this.ctx.strokeStyle = '#ff9800';
        this.ctx.lineWidth = 2;

        this.jitters.forEach((val, index) => {
            const x = padding.left + index * stepX;
            const y = padding.top + chartHeight - (val / maxJitter) * chartHeight;

            if (index === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        });
        this.ctx.stroke();

        this.jitters.forEach((val, index) => {
            const x = padding.left + index * stepX;
            const y = padding.top + chartHeight - (val / maxJitter) * chartHeight;

            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
            this.ctx.fillStyle = '#ff9800';
            this.ctx.fill();
        });
    }
}