class SafariBridge {
    constructor() {
        this._windowCounter = 1;
        this._windowToId = new WeakMap();
        this._idToWindow = new Map();
        this._tabCounter = 1;
        this._tabToId = new WeakMap();
        this._idToTab = new Map();
        this.messageHandlers = [];
        safari.application.addEventListener('message', (messageEvent) => {
            if (messageEvent.name != 'api_bridge') {
                return;
            }
            let target = messageEvent.target;
            let sender = {
                tab: {
                    id: this.getTabId(target),
                    index: null,
                    pinned: null,
                    highlighted: null,
                    windowId: null,
                    active: null,
                    incognito: null,
                    selected: null
                },
                url: target.url
            };
            this.onMessage(messageEvent.message, sender);
        }, false);
    }
    getWindowId(win) {
        let id = this._windowToId.get(win);
        if (!id) {
            id = this._windowCounter++;
            this._windowToId.set(win, id);
        }
        return id;
    }
    findWindowById(id) {
        let window = this._idToWindow.get(id);
        if (!window) {
            this.getWindows(false, () => window = this._idToWindow.get(id));
        }
        return window;
    }
    getWindows(onlyActive, callback) {
        let windows;
        if (onlyActive) {
            let window = safari.application.activeBrowserWindow;
            windows = window ? [window] : [];
        }
        else {
            windows = safari.application.browserWindows;
        }
        try {
            windows.forEach(window => {
                let id = this.getWindowId(window);
                this._idToWindow.set(id, window);
            });
            callback(windows);
        }
        finally {
            this._idToWindow.clear();
        }
    }
    getTabId(tab) {
        let id = this._tabToId.get(tab);
        if (!id) {
            id = this._tabCounter++;
            this._tabToId.set(tab, id);
        }
        return id;
    }
    findTabById(id) {
        let tab = this._idToTab.get(id);
        if (!tab) {
            this.getTabs({}, () => tab = this._idToTab.get(id));
        }
        return tab;
    }
    getTabs(queryInfo, callback) {
        let tabs = [];
        let windows;
        if (queryInfo.currentWindow || queryInfo.windowId === chrome.windows.WINDOW_ID_CURRENT) {
            let window = safari.application.activeBrowserWindow;
            windows = window ? [window] : [];
        }
        else {
            windows = safari.application.browserWindows;
        }
        for (let window of windows) {
            let windowTabs;
            if (queryInfo.active) {
                let activeTab = window.activeTab;
                windowTabs = activeTab ? [activeTab] : [];
            }
            else {
                windowTabs = window.tabs;
            }
            tabs.push(...windowTabs.filter(tab => {
                if (queryInfo.url && tab.url != queryInfo.url) {
                    return false;
                }
                return true;
            }));
        }
        try {
            tabs.forEach(tab => {
                let id = this.getTabId(tab);
                this._idToTab.set(id, tab);
            });
            callback(tabs);
        }
        finally {
            this._idToTab.clear();
        }
    }
    onMessage(message, sender, responseCallback) {
        this.messageHandlers.forEach(handler => handler(message, sender, responseCallback));
    }
}
window.safariBridge = new SafariBridge();
window.chrome = {
    runtime: {
        onMessage: {
            addListener: (handler) => {
                safariBridge.messageHandlers.push(handler);
            },
        }
    },
    windows: {
        WINDOW_ID_CURRENT: -2,
        update: (windowId, updateInfo) => {
            let window = safariBridge.findWindowById(windowId);
            if (window) {
                if (updateInfo.focused) {
                    window.activate();
                }
            }
        },
        getLastFocused: (callback) => {
            Promise.resolve().then(() => {
                safariBridge.getWindows(true, windows => {
                    let chromeWindow = null;
                    let window = windows[0];
                    if (window) {
                        chromeWindow = {
                            id: safariBridge.getWindowId(window),
                            left: 0,
                            top: 0,
                            width: 1000,
                            height: 800,
                            focused: true,
                            state: null,
                            alwaysOnTop: null,
                            incognito: null,
                            type: null
                        };
                    }
                    callback(chromeWindow);
                });
            });
        }
    },
    tabs: {
        sendMessage: (tabId, message) => {
            let tab = safariBridge.findTabById(tabId);
            tab && tab.page.dispatchMessage('api_bridge', message);
        },
        query: (queryInfo, callback) => {
            Promise.resolve().then(() => {
                safariBridge.getTabs(queryInfo, tabs => {
                    let chromeTabs = tabs.map(tab => ({
                        id: this.getTabId(tab.page),
                        windowId: safariBridge.getWindowId(tab.browserWindow),
                        title: tab.title,
                        url: tab.url,
                        index: null,
                        pinned: null,
                        highlighted: null,
                        active: null,
                        incognito: null,
                        selected: null
                    }));
                    callback(chromeTabs);
                });
            });
        },
        create: (createProperties) => {
            let window = safariBridge.findWindowById(createProperties.windowId);
            if (window) {
                let tab = window.openTab(createProperties.active ? 'foreground' : 'background');
                tab.url = createProperties.url;
            }
        },
        update: (tabId, updateProperties) => {
            let tab;
            for (let window of safari.application.browserWindows) {
                let tab = safariBridge.findTabById(tabId);
                if (tab) {
                    if (updateProperties.active) {
                        tab.activate();
                    }
                    break;
                }
            }
        },
        remove: (tabId) => {
        },
        onUpdated: {
            addListener: (handler) => {
            }
        },
        onRemoved: {
            addListener: (handler) => {
            }
        },
    },
    browserAction: {
        setIcon: (details) => {
        },
        setTitle: (details) => {
        }
    },
    notifications: {
        create: (notificationId, options, callback) => {
        },
        clear: (notificationId, options, callback) => {
        }
    }
};
