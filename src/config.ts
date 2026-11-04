/**
 * wagmi configuration
 * Built with Arc Studio — https://studio.arc.io
 */

import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { registerChain } from './tracing'
import { BRIDGE_CHAINS } from './lib/chains'

// Pre-register chain RPC URLs so trace events show correct chain names immediately
for (const { viem } of BRIDGE_CHAINS) {
  registerChain(viem.id, viem.rpcUrls.default.http[0])
}

const bridgeTransports = Object.fromEntries(BRIDGE_CHAINS.map(({ viem }) => [viem.id, http()]))

export const config = createConfig({
  // All CCTP testnets for the bridge, plus mainnet for ENS resolution
  chains: [BRIDGE_CHAINS[0].viem, ...BRIDGE_CHAINS.slice(1).map((c) => c.viem), mainnet],
  connectors: [injected()],
  transports: {
    ...bridgeTransports,
    [mainnet.id]: http(), // ENS resolution uses mainnet
  },
})
