export class TabManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.tabs = new Map();
        this.activeTabKey = null;
    }

    registerTab(key, tabInstance) {
        this.tabs.set(key, tabInstance);
    }

    async switchTab(tabKey) {
        if (this.activeTabKey && this.tabs.has(this.activeTabKey)) {
            const currentTab = this.tabs.get(this.activeTabKey);
            if (typeof currentTab.destroy === 'function') {
                currentTab.destroy();
            }
        }

        this.activeTabKey = tabKey;

        if (!this.tabs.has(tabKey)) {
            this.container.innerHTML = '<div class="empty-tab"><p style="color: #888; text-align: center; padding: 40px 0;">This Tab is not implemented yet.</p></div>';
            return;
        }

        const tab = this.tabs.get(tabKey);
        this.container.innerHTML = await tab.render();
        if (typeof tab.init === 'function') {
            tab.init();
        }
    }
}