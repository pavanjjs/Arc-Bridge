import type { Chain } from 'viem'
import {
  arbitrumSepolia,
  arcTestnet,
  avalancheFuji,
  baseSepolia,
  optimismSepolia,
  polygonAmoy,
  sepolia,
  unichainSepolia,
} from 'viem/chains'
import { getChain, getUsdc } from '@/onchain-facts'

export type BridgeChainKey =
  | 'Arc_Testnet'
  | 'Ethereum_Sepolia'
  | 'Base_Sepolia'
  | 'Arbitrum_Sepolia'
  | 'Avalanche_Fuji'
  | 'Optimism_Sepolia'
  | 'Polygon_Amoy_Testnet'
  | 'Unichain_Sepolia'

export interface BridgeChainInfo {
  /** App Kit chain identifier */
  key: BridgeChainKey
  /** Short slug, used for icons and React keys */
  slug: 'arc' | 'ethereum' | 'base' | 'arbitrum' | 'avalanche' | 'optimism' | 'polygon' | 'unichain'
  /** viem chain definition (wagmi + wallet add-chain fallback) */
  viem: Chain
  /** Display name */
  name: string
}

/** Every EVM testnet that supports CCTP V2 and is registered in the Arc Studio chain facts. */
export const BRIDGE_CHAINS: readonly BridgeChainInfo[] = [
  { key: 'Arc_Testnet', slug: 'arc', viem: arcTestnet, name: 'Arc Testnet' },
  { key: 'Ethereum_Sepolia', slug: 'ethereum', viem: sepolia, name: 'Ethereum Sepolia' },
  { key: 'Base_Sepolia', slug: 'base', viem: baseSepolia, name: 'Base Sepolia' },
  { key: 'Arbitrum_Sepolia', slug: 'arbitrum', viem: arbitrumSepolia, name: 'Arbitrum Sepolia' },
  { key: 'Avalanche_Fuji', slug: 'avalanche', viem: avalancheFuji, name: 'Avalanche Fuji' },
  { key: 'Optimism_Sepolia', slug: 'optimism', viem: optimismSepolia, name: 'OP Sepolia' },
  { key: 'Polygon_Amoy_Testnet', slug: 'polygon', viem: polygonAmoy, name: 'Polygon Amoy' },
  { key: 'Unichain_Sepolia', slug: 'unichain', viem: unichainSepolia, name: 'Unichain Sepolia' },
]

export const WAGMI_CHAINS = BRIDGE_CHAINS.map((c) => c.viem) as unknown as readonly [Chain, ...Chain[]]

export function chainByKey(key: BridgeChainKey): BridgeChainInfo {
  const found = BRIDGE_CHAINS.find((c) => c.key === key)
  if (!found) throw new Error(`Unsupported bridge chain: ${String(key)}`)
  return found
}

export function chainById(chainId: number | undefined): BridgeChainInfo | undefined {
  return BRIDGE_CHAINS.find((c) => c.viem.id === chainId)
}

/** USDC contract on a bridge chain, from Arc Studio's registry. */
export function usdcAddress(chainId: number): `0x${string}` | undefined {
  const address = getUsdc(chainId)?.address
  return address ? (address as `0x${string}`) : undefined
}

export function chainDisplayName(chainId: number): string {
  return getChain(chainId)?.name ?? chainById(chainId)?.name ?? `Chain ${chainId}`
}
