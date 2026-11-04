import { useCallback, useEffect, useRef, useState } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import type { BridgeResult } from '@circle-fin/app-kit'
import { adapterFromConnector, appKit, type BridgeOptions } from '@/lib/kit'
import { chainByKey, type BridgeChainKey } from '@/lib/chains'
import { parseBridgeError } from '@/lib/walletProvider'
import type { TransferRecord } from '@/hooks/useHistory'

export type StepName = 'approve' | 'burn' | 'fetchAttestation' | 'mint'
export const STEP_ORDER: readonly StepName[] = ['approve', 'burn', 'fetchAttestation', 'mint']

export interface StepProgress {
  done: boolean
  txHash?: string
  explorerUrl?: string
}

export type Phase = 'idle' | 'running' | 'success' | 'error'

export interface TransferInput extends BridgeOptions {
  fromKey: BridgeChainKey
  toKey: BridgeChainKey
  amount: string
}

const emptySteps = (): Record<StepName, StepProgress> => ({
  approve: { done: false },
  burn: { done: false },
  fetchAttestation: { done: false },
  mint: { done: false },
})

interface EventPayload {
  values: unknown
}

const hashOf = (payload: EventPayload): string | undefined => {
  const values = payload.values as { txHash?: unknown; transactionHash?: unknown } | null | undefined
  const v = values?.txHash ?? values?.transactionHash
  return typeof v === 'string' ? v : undefined
}

function isStepName(name: string): name is StepName {
  return (STEP_ORDER as readonly string[]).includes(name)
}

/** Runs a CCTP bridge from the connected browser wallet and tracks real step events. */
export function useBridgeTransfer(onRecord: (record: TransferRecord) => void) {
  const { connector, address, chainId: walletChainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()

  const [phase, setPhase] = useState<Phase>('idle')
  const [steps, setSteps] = useState<Record<StepName, StepProgress>>(emptySteps)
  const [error, setError] = useState<string | null>(null)
  const [canRetry, setCanRetry] = useState(false)
  const [current, setCurrent] = useState<TransferInput | null>(null)
  const lastResult = useRef<BridgeResult | null>(null)
  const lastInput = useRef<TransferInput | null>(null)

  // Subscribe to real step events from the kit for the lifetime of the hook.
  useEffect(() => {
    const mark = (name: StepName) => (payload: EventPayload) => {
      setSteps((prev) => ({ ...prev, [name]: { ...prev[name], done: true, txHash: hashOf(payload) } }))
    }
    const handlers = {
      'bridge.approve': mark('approve'),
      'bridge.burn': mark('burn'),
      'bridge.fetchAttestation': mark('fetchAttestation'),
      'bridge.mint': mark('mint'),
    } as const

    appKit.on('bridge.approve', handlers['bridge.approve'])
    appKit.on('bridge.burn', handlers['bridge.burn'])
    appKit.on('bridge.fetchAttestation', handlers['bridge.fetchAttestation'])
    appKit.on('bridge.mint', handlers['bridge.mint'])
    return () => {
      appKit.off('bridge.approve', handlers['bridge.approve'])
      appKit.off('bridge.burn', handlers['bridge.burn'])
      appKit.off('bridge.fetchAttestation', handlers['bridge.fetchAttestation'])
      appKit.off('bridge.mint', handlers['bridge.mint'])
    }
  }, [])

  const settle = useCallback(
    (result: BridgeResult, input: TransferInput, recipient: string) => {
      const next = emptySteps()
      for (const step of result.steps) {
        if (!isStepName(step.name)) continue
        next[step.name] = {
          done: step.state === 'success' || step.state === 'noop',
          txHash: step.txHash,
          explorerUrl: step.explorerUrl,
        }
      }
      setSteps(next)
      lastResult.current = result
      const from = chainByKey(input.fromKey)
      const to = chainByKey(input.toKey)
      onRecord({
        id: `${result.source.address}-${next.burn.txHash ?? Date.now()}`,
        timestamp: Date.now(),
        amount: result.amount,
        from: input.fromKey,
        to: input.toKey,
        fromChainId: from.viem.id,
        toChainId: to.viem.id,
        state: result.state,
        burnTx: next.burn.txHash,
        mintTx: next.mint.txHash,
        recipient,
      })
      if (result.state === 'success') {
        setPhase('success')
        setCanRetry(false)
      } else {
        const failed = result.steps.find((s) => s.state === 'error')
        setPhase('error')
        setError(
          failed
            ? `The ${failed.name} step failed. Your funds are safe. Resume to continue from this step.`
            : 'The transfer did not complete. Resume to continue.',
        )
        setCanRetry(true)
      }
    },
    [onRecord],
  )

  const start = useCallback(
    async (input: TransferInput) => {
      if (!connector || !address) return
      setPhase('running')
      setError(null)
      setCanRetry(false)
      setSteps(emptySteps())
      setCurrent(input)
      lastInput.current = input
      lastResult.current = null

      try {
        const from = chainByKey(input.fromKey)
        if (walletChainId !== from.viem.id) {
          await switchChainAsync({ chainId: from.viem.id })
        }
        const adapter = await adapterFromConnector(connector)
        const recipient = input.recipient ?? address
        const extra = input.recipient ? { recipientAddress: input.recipient } : {}
        const to = input.useForwarder
          ? { chain: input.toKey, useForwarder: true as const, recipientAddress: recipient }
          : { adapter, chain: input.toKey, ...extra }

        const result = await appKit.bridge({
          from: { adapter, chain: input.fromKey },
          to,
          amount: input.amount,
          config: { transferSpeed: input.speed },
        })
        settle(result, input, recipient)
      } catch (e) {
        const parsed = parseBridgeError(e)
        setPhase(parsed.cancelled ? 'idle' : 'error')
        setError(parsed.cancelled ? null : parsed.message)
        setCanRetry(false)
      }
    },
    [connector, address, walletChainId, switchChainAsync, settle],
  )

  const retry = useCallback(async () => {
    const result = lastResult.current
    const input = lastInput.current
    if (!result || !input || !connector || !address) return
    setPhase('running')
    setError(null)
    try {
      const adapter = await adapterFromConnector(connector)
      const resumed = await appKit.retryBridge(result, { from: adapter, to: adapter })
      settle(resumed, input, input.recipient ?? address)
    } catch (e) {
      setPhase('error')
      setError(parseBridgeError(e).message)
      setCanRetry(true)
    }
  }, [connector, address, settle])

  const reset = useCallback(() => {
    setPhase('idle')
    setSteps(emptySteps())
    setError(null)
    setCanRetry(false)
    setCurrent(null)
    lastResult.current = null
  }, [])

  return { phase, steps, error, canRetry, current, start, retry, reset }
}
