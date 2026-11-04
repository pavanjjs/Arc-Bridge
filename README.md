# Arc Bridge

A multichain USDC bridge built on Circle CCTP. Connect a browser wallet and move USDC between Arc Testnet, Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, Avalanche Fuji, OP Sepolia, Polygon Amoy and Unichain Sepolia. Choose fast or standard transfer speed, optionally let Circle deliver the funds on the destination chain, send to a different recipient, and review recent transfers.

Live app: [https://pavanjj-app-24c1ccdf-8f76-447f-b548-f76b73857eff.static.hf.space](https://pavanjj-app-24c1ccdf-8f76-447f-b548-f76b73857eff.static.hf.space)

Built with [Arc Studio](https://studio.arc.io)

## Tech stack

- React, TypeScript, Vite, Tailwind CSS
- wagmi, viem, ConnectKit for wallet connection
- Circle App Kit for bridging

## Development

Prerequisites: [Bun](https://bun.sh).

```bash
bun install
bun run dev
```

Other scripts: `bun run check` (lint and typecheck).

### Environment variables

None.
