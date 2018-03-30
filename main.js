import ProxyServer from './lib/ProxyServer';

const address = process.argv[2] || '0.0.0.0:9230';
const [host, port] = address.split(':');
const server = new ProxyServer();
console.info(`
Debugger Proxy listening on port ${port}.
To start debugging, open the following URL in Chrome:
    chrome-devtools://devtools/bundled/node_app.html?ws=127.0.0.1:${port}/9229
The suffix of the URL "9229" is the port which you want to proxy.
`);
server.listen(port, host);

