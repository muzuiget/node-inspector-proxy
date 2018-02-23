import WebSocket from 'ws';
import http from 'http';
import liburl from 'url';

export default class Proxy {

    constructor() {
        this.server = null;
        this.sessions = {};
    }

    listen(port, host) {
        port = parseInt(port);
        this.server = new WebSocket.Server({host, port});
        this.server.on('connection', this.onServerConnection);
    }

    onServerConnection = (frontend, incomingMessage) => {
        frontend._socket.pause();
        const parsedUrl = liburl.parse(incomingMessage.url, true);
        const id = parsedUrl.pathname.slice(1);

        this.closeSession(id);
        const session = {frontend, backend: null};
        this.sessions[id] = session;
        this.getBackendUuid(id);
    }

    getBackendUuid(id) {
        const url = `http://127.0.0.1:${id}/json`;
        http.get(url, (resp) => {
            let rawData = '';
            resp.on('data', (chunk) => rawData += chunk);
            resp.on('end', () => {
                const info = JSON.parse(rawData)[0];
                const debuggerUrl = info.webSocketDebuggerUrl;
                if (debuggerUrl) {
                    this.initBackend(id, debuggerUrl);
                    return;
                }
                const wsUrl = `ws://127.0.0.1:${id}/${info.id}`;
                const msg = `Error: a devTools has connected to ${wsUrl}`;
                console.error(msg);
                this.closeSession(id);
            });
        }).on('error', (e) => {
            console.error(`Error: ${e.message}`);
            this.closeSession(id);
        });
    }

    startSession(id) {
        const session = this.sessions[id];
        session.frontend.on('message', this.onFrontendMessage(id));
        session.backend.on('message',  this.onBackendMessage(id));
        session.frontend.on('close', this.onFrontendClose(id));
        session.backend.on('close',  this.onBackendClose(id));
        session.frontend._socket.resume();
        session.backend._socket.resume();
    }

    closeSession(id) {
        const session = this.sessions[id];
        if (!session) {
            return;
        }
        if (session.frontend) {
            session.frontend.close();
        }
        if (session.backend) {
            session.backend.close();
        }
        delete this.sessions[id];
    }

    onFrontendClose = (id) => () => {
        this.closeSession(id);
    }

    onBackendClose = (id) => () => {
        this.closeSession(id);
    }

    onFrontendMessage = (id) => (data) => {
        const session = this.sessions[id];
        if (session.backend) {
            session.backend.send(data);
        }
    }

    onBackendMessage = (id) => (data) => {
        const session = this.sessions[id];
        if (session.frontend) {
            session.frontend.send(data);
        }
    }

    initBackend(id, url) {
        const backend = new WebSocket(url);
        backend.on('open', () => {
            backend._socket.pause();
            const session = this.sessions[id];
            if (session) {
                session.backend = backend;
                this.startSession(id);
            } else {
                backend.close();
            }
        });
    }

}
