import { AppKit } from '@circle-fin/app-kit'
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'
import type { Connector } from 'wagmi'
import type { EIP1193Provider } from 'viem'
import { WAGMI_CHAINS } from '@/lib/chains'
import { withAddChainFallback } from '@/lib/walletProvider'

/** One App Kit instance for the whole app. Bridging needs no kit key. */
export const appKit = new AppKit()

export type BridgeSpeed = 'FAST' | 'SLOW'

export interface BridgeOptions {
  speed: BridgeSpeed
  /** Let Circle's Forwarding Service submit the destination mint (fee applies). */
  useForwarder: boolean
  /** Optional recipient on the destination chain. Defaults to the connected wallet. */
  recipient?: `0x${string}`
}

/** Build a viem adapter from the connected browser wallet. */
export async function adapterFromConnector(connector: Connector) {
  const provider = (await connector.getProvider()) as EIP1193Provider
  return createViemAdapterFromProvider({
    provider: withAddChainFallback(provider, WAGMI_CHAINS),
  })
}

export type KitAdapter = Awaited<ReturnType<typeof adapterFromConnector>>
