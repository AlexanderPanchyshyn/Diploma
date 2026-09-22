import { TabManager } from './core/TabManager.js';
import { WebSocketTab } from './websocket/WebSocketTab.js';
import { SseTab } from "./sse/SseTab.js";
import { WebRtcTab } from "./webRtc/WebRtcTab.js";

document.addEventListener('DOMContentLoaded', async () => {
    const tabManager = new TabManager('tab-content');

    tabManager.registerTab('websocket', new WebSocketTab());
    tabManager.registerTab('sse', new SseTab());
    tabManager.registerTab('webrtc', new WebRtcTab());

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