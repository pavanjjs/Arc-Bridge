import { useEffect, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { adapterFromConnector, appKit, type BridgeOptions } from '@/lib/kit'
import type { BridgeChainKey } from '@/lib/chains'

export interface FeeLine {
  label: string
  amount: string
  token: string
}

export interface EstimateState {
  lines: FeeLine[]
  loading: boolean
  error: string | null
}

const IDLE: EstimateState = { lines: [], loading: false, error: null }

interface Params extends BridgeOptions {
  fromKey: BridgeChainKey
  toKey: BridgeChainKey
  fromChainId: number
  amount: string
  /** Only estimate when the input is a valid, positive amount. */
  enabled: boolean
}

const FEE_LABELS: Record<string, string> = {
  kit: 'Service fee',
  provider: 'CCTP fast-transfer fee',
  forwarder: 'Forwarding fee',
}

/**
 * Real fee quote from App Kit. Runs only while the wallet sits on the source chain,
 * so quoting never triggers a wallet prompt.
 */
export function useBridgeEstimate(params: Params): EstimateState {
  const { connector, address, chainId: walletChainId } = useAccount()
  const [snapshot, setSnapshot] = useState<{ key: string; state: EstimateState } | null>(null)
  const requestId = useRef(0)

  const { fromKey, toKey, fromChainId, amount, enabled, speed, useForwarder, recipient } = params
  const ready = enabled && Boolean(connector && address) && walletChainId === fromChainId
  const key = `${fromKey}|${toKey}|${amount}|${speed}|${String(useForwarder)}|${recipient ?? ''}`

  useEffect(() => {
    if (!ready || !connector) {
      requestId.current += 1
      return
    }
    const id = ++requestId.current

    const run = async () => {
      try {
        const adapter = await adapterFromConnector(connector)
        const to = useForwarder
          ? { adapter, chain: toKey, useForwarder: true, ...(recipient ? { recipientAddress: recipient } : {}) }
          : { adapter, chain: toKey, ...(recipient ? { recipientAddress: recipient } : {}) }
        const estimate = await appKit.estimateBridge({
          from: { adapter, chain: fromKey },
          to,
          amount,
          config: { transferSpeed: speed },
        })
        if (id !== requestId.current) return

        const lines: FeeLine[] = []
        for (const fee of estimate.fees) {
          if (fee.amount === null) continue
          lines.push({ label: FEE_LABELS[fee.type] ?? 'Fee', amount: fee.amount, token: String(fee.token) })
        }
        for (const gas of estimate.gasFees) {
          const value = gas.fees?.fee
          if (!value) continue
          lines.push({ label: `Gas: ${gas.name}`, amount: value, token: gas.token })
        }
        setSnapshot({ key, state: { lines, loading: false, error: null } })
      } catch (error) {
        if (id !== requestId.current) return
        const message = error instanceof Error ? error.message : 'Estimate unavailable'
        setSnapshot({ key, state: { lines: [], loading: false, error: message.slice(0, 140) } })
      }
    }
    const timer = setTimeout(() => {
      void run()
    }, 500)

    return () => clearTimeout(timer)
  }, [ready, connector, fromKey, toKey, amount, speed, useForwarder, recipient, key])

  if (!ready) return IDLE
  if (snapshot?.key === key) return snapshot.state
  return { lines: [], loading: true, error: null }
}
