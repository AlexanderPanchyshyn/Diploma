export class PacketLossChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.total = 0;
        this.received = 0;
        this.lost = 0;
    }

    setStats(total, received) {
        this.total = total;
        this.received = received;
        this.lost = Math.max(0, total - received);
        this.draw();
    }

    clear() {
        this.total = 0;
        this.received = 0;
        this.lost = 0;
        this.draw();
    }

    draw() {
        const width = this.canvas.width = this.canvas.parentElement.clientWidth;
        const height = this.canvas.height = 220;
        this.ctx.clearRect(0, 0, width, height);

        if (this.total === 0) {
            this.ctx.fillStyle = '#666';
            this.ctx.font = '12px sans-serif';
            this.ctx.fillText('No packet loss data available', 20, 30);
            return;
        }

        const centerX = width / 3;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        const receivedRatio = this.received / this.total;
        const lostRatio = this.lost / this.total;

        const receivedAngle = receivedRatio * 2 * Math.PI;
        const lostAngle = lostRatio * 2 * Math.PI;

        if (this.received > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, 0, receivedAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fill();
        }

        if (this.lost > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, receivedAngle, receivedAngle + lostAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = '#F44336';
            this.ctx.fill();
        }

        const legendX = centerX + radius + 40;
        const receivedPercent = (receivedRatio * 100).toFixed(2);
        const lostPercent = (lostRatio * 100).toFixed(2);

        this.ctx.font = '13px sans-serif';
        this.ctx.textAlign = 'left';

        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 13px sans-serif';
        this.ctx.fillText(`Total Sent: ${this.total.toLocaleString()}`, legendX, centerY - 30);

        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(legendX, centerY - 10, 12, 12);
        this.ctx.fillStyle = '#333';
        this.ctx.font = '13px sans-serif';
        this.ctx.fillText(`Received: ${this.received.toLocaleString()} (${receivedPercent}%)`, legendX + 20, centerY);

        this.ctx.fillStyle = '#F44336';
        this.ctx.fillRect(legendX, centerY + 15, 12, 12);
        this.ctx.fillStyle = '#333';
        this.ctx.fillText(`Lost: ${this.lost.toLocaleString()} (${lostPercent}%)`, legendX + 20, centerY + 26);
    }
}