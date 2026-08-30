export class LatencyChart {
    constructor(canvasId) {
        this.latencies = [];
        this.isLoading = false;
        this.loadedCount = 0;
        this.totalCount = 0;
        this.animationFrameId = null;

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

    setLoading(loading, loadedCount = 0, totalCount = 0) {
        this.isLoading = loading;
        this.loadedCount = loadedCount;
        this.totalCount = totalCount;

        if (this.isLoading) {
            this.startLoadingAnimation();
        } else {
            this.stopLoadingAnimation();
        }
    }

    setLatencies(latencies) {
        this.stopLoadingAnimation();
        this.isLoading = false;
        this.latencies = latencies ? [...latencies] : [];
        this.draw();
    }

    clear() {
        this.stopLoadingAnimation();
        this.isLoading = false;
        this.latencies = [];
        this.draw();
    }

    startLoadingAnimation() {
        if (this.animationFrameId) return;

        const animate = () => {
            if (!this.isLoading) return;
            this.drawLoading();
            this.animationFrameId = requestAnimationFrame(animate);
        };

        this.animationFrameId = requestAnimationFrame(animate);
    }

    stopLoadingAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    resizeCanvas() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        if (!parent) return;

        const width = parent.clientWidth;
        const height = parent.clientHeight || 250;

        if (width > 0 && height > 0) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
    }

    drawLoading() {
        if (!this.canvas || !this.ctx) return;

        this.resizeCanvas();
        const width = this.canvas.width;
        const height = this.canvas.height;

        this.ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2 - 10;
        const radius = 20;
        const angle = (Date.now() / 150) % (Math.PI * 2);

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, angle, angle + Math.PI * 1.5);
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();

        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';

        const percent = this.totalCount > 0
            ? Math.round((this.loadedCount / this.totalCount) * 100)
            : 0;

        this.ctx.fillText(
            `Loading batch data... ${this.loadedCount} / ${this.totalCount} (${percent}%)`,
            centerX,
            centerY + radius + 25
        );
    }

    draw() {
        if (this.isLoading) {
            this.drawLoading();
            return;
        }

        if (!this.canvas || !this.ctx) return;

        this.resizeCanvas();
        const width = this.canvas.width;
        const height = this.canvas.height;
        const padding = { top: 40, right: 30, bottom: 45, left: 30 };

        this.ctx.clearRect(0, 0, width, height);

        const totalCount = this.latencies.length;

        if (totalCount === 0) {
            this.ctx.fillStyle = '#1e293b';
            this.ctx.font = 'bold 12px sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('Total pings: 0 | Min: 0 ms | Max: 0 ms | Avg: 0 ms', padding.left, 20);
            return;
        }

        const minLatency = Math.min(...this.latencies);
        const maxLatency = Math.max(...this.latencies);
        const sumLatency = this.latencies.reduce((a, b) => a + b, 0);
        const avgLatency = Math.round(sumLatency / totalCount);

        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(
            `Total pings: ${totalCount} | Min: ${minLatency} ms | Max: ${maxLatency} ms | Avg: ${avgLatency} ms`,
            padding.left,
            20
        );

        const freqMap = new Map();
        this.latencies.forEach(lat => {
            freqMap.set(lat, (freqMap.get(lat) || 0) + 1);
        });

        const uniqueKeys = Array.from(freqMap.keys()).sort((a, b) => a - b);
        let columns;

        if (uniqueKeys.length <= 15) {
            columns = uniqueKeys.map(key => ({
                label: `${key}ms`,
                count: freqMap.get(key)
            }));
        } else {
            const NUM_BUCKETS = 15;
            const range = Math.max(1, maxLatency - minLatency);
            const binSize = range / NUM_BUCKETS;

            const buckets = Array.from({ length: NUM_BUCKETS }, (_, i) => ({
                min: Math.round(minLatency + i * binSize),
                max: Math.round(minLatency + (i + 1) * binSize),
                count: 0
            }));

            this.latencies.forEach(lat => {
                let idx = Math.floor((lat - minLatency) / binSize);
                if (idx >= NUM_BUCKETS) idx = NUM_BUCKETS - 1;
                buckets[idx].count++;
            });

            columns = buckets.map(b => ({
                label: b.min === b.max ? `${b.min}ms` : `${b.min}-${b.max}ms`,
                count: b.count
            }));
        }

        const maxFreq = Math.max(...columns.map(c => c.count), 1);
        const availableWidth = width - padding.left - padding.right;
        const graphHeight = height - padding.top - padding.bottom;

        const gap = 12;
        let barWidth = (availableWidth - gap * columns.length) / columns.length;

        if (barWidth > 90) barWidth = 90;
        if (barWidth < 10) barWidth = 10;

        const totalGroupWidth = columns.length * barWidth + (columns.length - 1) * gap;
        const startX = (width - totalGroupWidth) / 2;

        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(padding.left, height - padding.bottom);
        this.ctx.lineTo(width - padding.right, height - padding.bottom);
        this.ctx.stroke();

        columns.forEach((col, index) => {
            const barHeight = (col.count / maxFreq) * graphHeight;
            const x = startX + index * (barWidth + gap);
            const y = height - padding.bottom - barHeight;

            if (col.count > 0) {
                this.ctx.fillStyle = '#3b82f6';
                this.ctx.fillRect(x, y, barWidth, barHeight);

                this.ctx.fillStyle = '#1e293b';
                this.ctx.font = 'bold 11px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(col.count.toString(), x + barWidth / 2, y - 6);
            }

            this.ctx.fillStyle = '#64748b';
            this.ctx.font = '11px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(col.label, x + barWidth / 2, height - padding.bottom + 18);
        });
    }
}