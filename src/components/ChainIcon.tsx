import {
  NetworkArbitrumOne,
  NetworkArc,
  NetworkAvalanche,
  NetworkBase,
  NetworkEthereum,
  NetworkOptimism,
  NetworkPolygon,
  NetworkUnichain,
} from '@web3icons/react'
import type { BridgeChainInfo } from '@/lib/chains'

export function ChainIcon({ slug, size = 24 }: { slug: BridgeChainInfo['slug']; size?: number }) {
  const props = { variant: 'branded' as const, size }
  switch (slug) {
    case 'arc':
      return <NetworkArc {...props} />
    case 'ethereum':
      return <NetworkEthereum {...props} />
    case 'base':
      return <NetworkBase {...props} />
    case 'arbitrum':
      return <NetworkArbitrumOne {...props} />
    case 'avalanche':
      return <NetworkAvalanche {...props} />
    case 'optimism':
      return <NetworkOptimism {...props} />
    case 'polygon':
      return <NetworkPolygon {...props} />
    case 'unichain':
      return <NetworkUnichain {...props} />
  }
}
