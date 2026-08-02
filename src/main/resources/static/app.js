let socket = null;

function connect() {
    socket = new WebSocket('ws://' + window.location.host + '/websocket');

    socket.onopen = function() {
        updateStatus(true);
        log('Successfully connected to WebSocket');
    };

    socket.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);

            const clientDate = new Date(data.clientTimestamp);
            const serverDate = new Date(data.serverTimestamp);

            const formatTime = (date) => date.toLocaleTimeString('uk-UA') + '.' + String(date.getMilliseconds()).padStart(3, '0');

            const clientTimeString = formatTime(clientDate);
            const serverTimeString = formatTime(serverDate);

            document.getElementById('clientTime').innerText = `${clientTimeString}`;
            document.getElementById('serverTime').innerText = `${serverTimeString}`;
            document.getElementById('latencyValue').innerText = data.latency;

            log(`Client: ${clientTimeString} | Server: ${serverTimeString} | Diff: ${data.latency} ms`);
        } catch (e) {
            log('Error parsing JSON: ' + event.data);
        }
    };

    socket.onerror = function(error) {
        log('WebSocket Error: ' + error);
    };

    socket.onclose = function() {
        updateStatus(false);
        log('Successfully disconnected from WebSocket');
    };
}

function disconnect() {
    if (socket) {
        socket.close();
    }
}

function sendPing() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const timestamp = Date.now().toString();
        socket.send(timestamp);
    }
}

function updateStatus(isConnected) {
    const statusEl = document.getElementById('status');
    document.getElementById('connectBtn').disabled = isConnected;
    document.getElementById('disconnectBtn').disabled = !isConnected;
    document.getElementById('pingBtn').disabled = !isConnected;

    if (isConnected) {
        statusEl.innerText = 'Connected';
        statusEl.className = 'connected';
    } else {
        statusEl.innerText = 'Disconnected';
        statusEl.className = 'disconnected';
    }
}

function log(message) {
    const logBox = document.getElementById('log');
    const entry = document.createElement('div');
    entry.innerText = `[${new Date().toLocaleTimeString()}] ${message}`;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
}