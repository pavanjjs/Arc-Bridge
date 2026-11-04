import { numberToHex, type Chain, type EIP1193Provider } from 'viem'

type RequestFn = (args: { method: string; params?: unknown }) => Promise<unknown>

const isUnrecognizedChain = (error: unknown): boolean => {
  const e = error as { code?: number; data?: { originalError?: { code?: number } } }
  return e?.code === 4902 || e?.data?.originalError?.code === 4902 // nested on MetaMask mobile
}

/**
 * Wraps a wallet provider so that a chain-switch to a chain the wallet doesn't know
 * adds the chain first and retries. Without this, a destination chain the wallet lacks
 * fails the mint after the burn already happened.
 */
export function withAddChainFallback(provider: EIP1193Provider, chains: readonly Chain[]): EIP1193Provider {
  const send = provider.request.bind(provider) as unknown as RequestFn
  const request = (async (args: { method: string; params?: unknown }) => {
    try {
      return await send(args)
    } catch (error) {
      if (args.method !== 'wallet_switchEthereumChain' || !isUnrecognizedChain(error)) throw error
      const [{ chainId }] = args.params as [{ chainId: string }]
      const chain = chains.find((c) => c.id === Number(chainId))
      if (!chain) throw error
      await send({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: numberToHex(chain.id),
            chainName: chain.name,
            nativeCurrency: chain.nativeCurrency,
            rpcUrls: [...chain.rpcUrls.default.http],
            blockExplorerUrls: chain.blockExplorers ? [chain.blockExplorers.default.url] : undefined,
          },
        ],
      })
      return send(args)
    }
  }) as EIP1193Provider['request']

  // A Proxy, not a spread: wallet providers are class instances.
  return new Proxy(provider, {
    get(target, prop) {
      if (prop === 'request') return request
      const value: unknown = Reflect.get(target, prop, target)
      return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value
    },
  })
}

/** Turn a wallet/SDK error into a short user-facing sentence. */
export function parseBridgeError(error: unknown): { message: string; cancelled: boolean } {
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const lower = raw.toLowerCase()
  const code = (error as { code?: number } | null)?.code
  if (code === 4001 || lower.includes('user rejected') || lower.includes('user denied')) {
    return { message: 'Request cancelled in wallet.', cancelled: true }
  }
  if (lower.includes('insufficient funds') || lower.includes('exceeds balance')) {
    return { message: 'Not enough balance for the transfer or the gas fee on this chain.', cancelled: false }
  }
  if (lower.includes('unsupported_route') || lower.includes('unsupported route')) {
    return { message: 'This route is not supported. Pick a different chain pair.', cancelled: false }
  }
  if (lower.includes('network') || lower.includes('timeout') || lower.includes('http request failed')) {
    return { message: 'Network issue. Check your connection and try again.', cancelled: false }
  }
  return { message: raw.length > 0 && raw.length < 200 ? raw : 'Bridge failed. Please try again.', cancelled: false }
}
