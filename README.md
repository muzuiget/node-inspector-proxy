node-inspector-proxy
====================

A workaround solution for this issues https://github.com/nodejs/node/issues/9185

When you debugging node program:

```
$ node --inspect=9229
Debugger listening on ws://127.0.0.1:9229/ac074a32-0956-4b36-aa6b-b503d130eedb
For help, see: https://nodejs.org/en/docs/inspector
>
```

Each time you restart the node program, a new UUID like `ac074a32-0956-4b36-aa6b-b503d130eedb` is regenerated, copy then paste it to Chrome is annoying.

Now you can use node-inspector-proxy:

```
git clone https://github.com/muzuiget/node-inspector-proxy.git
cd node-inspector-proxy
yarn install
yarn start 127.0.0.1:9230
```

Then will start a proxy server, open the url in Chrome:

```
chrome-devtools://devtools/bundled/js_app.html?ws=127.0.0.1:9230/9229
```

The suffix string `9229` is your node program debugger server port, which you pass it with `--inspect=` option

node-inspector-proxy will visit `http://127.0.0.1:9229/json` to get the UIID, then proxy the data for you.

After you restart node program, just click Refresh button on Chrome to reconnect, goodbye UUID!

You can open many debugger servers, only need one node-inspector-proxy to proxy them all, just open a new Chrome tab then change the port in the url.
