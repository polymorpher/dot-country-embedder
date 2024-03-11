How to run

- Install node packages under client, server and common

- Add client env under /client

```
EMBEDDER_CONTRACT=0xf90dab949d3853c418bE361930028644B4EBcDE4
DEFAULT_RPC=https://harmony.rpc.hiddenstate.xyz/
SUBSTACK_SERVER=
#SERVER=https://dev.hiddenstate.xyz
SERVER=https://1ns-embedder.hiddenstate.xyz
CHAIN_ID=1666600000
WALLET_CONNECT_ID=a7d79ca1602377d399f5697d1b612426
TITLE_URL_PREFIX=
#TLD=localhost:3100
```

- Add server env under /server

```
DEBUG=false
CORS=*
EMBEDDER_CONTRACT=0xf90dab949d3853c418bE361930028644B4EBcDE4
DEFAULT_RPC=https://harmony.rpc.hiddenstate.xyz/
```

- Generate certs

Run `server/certs/gen.sh`

- Run the app on your local

```
# client
yarn debug

# server
yarn debug
```

- Check app is running

https://[custom domain].s.localhost:3100/
# i.e
https://xn--qv9h.s.localhost:3100/

ngrok http --hostname=hiddenstate-0306.ngrok.io http://localhost:3002 --host-header=rewrite
