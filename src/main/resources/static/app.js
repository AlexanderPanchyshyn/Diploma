import { TabManager } from './core/TabManager.js';
import { WebSocketTab } from './websocket/latency/WebSocketTab.js';

document.addEventListener('DOMContentLoaded', async () => {
    const tabManager = new TabManager('tab-content');

    tabManager.registerTab('websocket', new WebSocketTab());
    // tabManager.registerTab('sse', new SseTab());
    // tabManager.registerTab('webrtc', new WebRtcTab());
    // tabManager.registerTab('webtransport', new WebTransportTab());

    const navTabs = document.querySelectorAll('.tab-btn');

    navTabs.forEach(button => {
        button.addEventListener('click', async (e) => {
            const tabKey = e.target.dataset.tab;

            navTabs.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            await tabManager.switchTab(tabKey);
        });
    });

    await tabManager.switchTab('websocket');
});