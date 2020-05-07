window.chrome = {
    runtime: {
        onMessage: {
            addListener: (handler) => {
                safari.self.addEventListener('message', (messageEvent) => {
                    if (messageEvent.name == 'api_bridge') {
                        handler(messageEvent.message, null, null);
                    }
                }, false);
            }
        },
        sendMessage: (message) => {
            safari.self.tab.dispatchMessage('api_bridge', message);
        }
    }
};
