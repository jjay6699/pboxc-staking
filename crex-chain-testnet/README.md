# CREX Chain Testnet

This folder contains a deployable single-node EVM testnet for **CONNECT REDEFINE EXCHANGE (CREX)**.

It is intended for early app development, wallet testing, staking-contract testing, and frontend integration. It is not a production mainnet architecture.

## Chain details

```text
Network name: CREX Chain Testnet
Chain ID: 63917
Currency symbol: CREX
Decimals: 18
RPC URL: your Railway public URL
Block time: 2 seconds
```

## Railway deployment

Railway can run this because it supports Docker services, public HTTP networking, and persistent volumes.

Recommended Railway setup:

1. Push this repository to GitHub.
2. In Railway, create a new service from the GitHub repo.
3. Set the root directory to:

```text
crex-chain-testnet
```

4. Add a Railway volume mounted at:

```text
/data
```

5. Add variables:

```text
CHAIN_ID=63917
BLOCK_TIME=2
STATE_FILE=/data/crex-anvil-state.json
```

6. Optional but recommended: set your own mnemonic.

```text
MNEMONIC=replace this with your own testnet mnemonic
```

7. Expose the service with Railway public HTTP networking.

Railway will provide a URL like:

```text
https://your-service.up.railway.app
```

Use that as the MetaMask RPC URL.

## Local Docker run

```bash
docker build -t crex-chain-testnet .
docker run --rm -p 8545:8545 -v crex-chain-data:/data crex-chain-testnet
```

Local RPC:

```text
http://localhost:8545
```

## Verify RPC

```bash
curl -X POST http://localhost:8545 \
  -H "content-type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

Expected result:

```text
0xf9ad
```

`0xf9ad` is hexadecimal for `63917`.

## Important limitations

This is a single-node dev/test chain. It is useful for development, but it does not provide:

- Decentralized validators
- A canonical bridge
- A production block explorer
- Economic security
- Sequencer fault proofs
- Mainnet-grade finality assumptions

For a real CREX Chain mainnet, move to OP Stack, Arbitrum Orbit, Polygon CDK, or Avalanche Subnet-EVM after the staking contracts and wallet flow are proven.
