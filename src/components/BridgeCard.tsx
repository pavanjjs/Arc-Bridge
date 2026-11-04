import { useCallback, useMemo, useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import { useAccount, useSwitchChain } from 'wagmi'
import { isAddress } from 'viem'
import { ArrowDown, Loader2 } from 'lucide-react'
import { AmountPanel } from '@/components/AmountPanel'
import { OptionsPanel } from '@/components/OptionsPanel'
import { StepTracker } from '@/components/StepTracker'
import { History } from '@/components/History'
import { useUsdcBalance } from '@/hooks/useUsdcBalance'
import { useBridgeEstimate } from '@/hooks/useBridgeEstimate'
import { useBridgeTransfer } from '@/hooks/useBridgeTransfer'
import { useHistory } from '@/hooks/useHistory'
import { chainByKey, type BridgeChainKey } from '@/lib/chains'
import type { BridgeSpeed } from '@/lib/kit'
import { Amount, parseAmount } from '@/onchain-money'

function tryParse(chainId: number, value: string): Amount | null {
  if (!value || value === '.') return null
  try {
    return parseAmount(chainId, value)
  } catch {
    return null
  }
}

export function BridgeCard() {
  const { address, isConnected, chainId: walletChainId } = useAccount()
  const { switchChain, isPending: switching } = useSwitchChain()

  const [fromKey, setFromKey] = useState<BridgeChainKey>('Arc_Testnet')
  const [toKey, setToKey] = useState<BridgeChainKey>('Base_Sepolia')
  const [amount, setAmount] = useState('')
  const [speed, setSpeed] = useState<BridgeSpeed>('FAST')
  const [useForwarder, setUseForwarder] = useState(false)
  const [recipient, setRecipient] = useState('')

  const from = chainByKey(fromKey)
  const to = chainByKey(toKey)

  const fromBalance = useUsdcBalance(from.viem.id)
  const toBalance = useUsdcBalance(to.viem.id)
  const { records, save } = useHistory(address)
  const transfer = useBridgeTransfer(save)

  const parsed = tryParse(from.viem.id, amount)
  const positive = parsed !== null && parsed.raw > 0n
  const insufficient = Boolean(parsed && fromBalance.balance && parsed.raw > fromBalance.balance.raw)
  const recipientValid = recipient === '' || isAddress(recipient)
  const validRecipient = recipient !== '' && isAddress(recipient) ? (recipient) : undefined

  const running = transfer.phase === 'running'
  const locked = running || transfer.phase === 'success'
  const wrongChain = isConnected && walletChainId !== from.viem.id

  const estimate = useBridgeEstimate({
    fromKey,
    toKey,
    fromChainId: from.viem.id,
    amount,
    enabled: positive && !insufficient && recipientValid && !locked,
    speed,
    useForwarder,
    recipient: validRecipient,
  })

  const receive = useMemo(() => {
    if (!parsed || !positive) return ''
    let net = parsed
    for (const line of estimate.lines) {
      if (line.token !== 'USDC' || line.label.startsWith('Gas')) continue
      const fee = tryParse(to.viem.id, line.amount)
      if (fee && fee.raw <= net.raw) net = Amount.fromRaw(net.raw - fee.raw, net.decimals)
    }
    return net.toString()
  }, [parsed, positive, estimate.lines, to.viem.id])

  const swapSides = useCallback(() => {
    if (locked) return
    setFromKey(toKey)
    setToKey(fromKey)
  }, [fromKey, toKey, locked])

  const changeFrom = (key: BridgeChainKey) => {
    if (key === toKey) setToKey(fromKey)
    setFromKey(key)
  }
  const changeTo = (key: BridgeChainKey) => {
    if (key === fromKey) setFromKey(toKey)
    setToKey(key)
  }

  const submit = () => {
    if (!positive || insufficient || !recipientValid) return
    void transfer.start({ fromKey, toKey, amount, speed, useForwarder, recipient: validRecipient })
  }

  const ctaClass =
    'flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40'
  const ctaStyle = { background: 'var(--accent)', color: '#0d1b2f' }

  let cta: React.ReactNode
  if (!isConnected) {
    cta = (
      <ConnectKitButton.Custom>
        {({ show }) => (
          <button type="button" onClick={show} className={ctaClass} style={ctaStyle}>
            Connect wallet
          </button>
        )}
      </ConnectKitButton.Custom>
    )
  } else if (transfer.phase === 'success') {
    cta = (
      <button
        type="button"
        onClick={() => {
          transfer.reset()
          setAmount('')
          void fromBalance.refetch()
          void toBalance.refetch()
        }}
        className={ctaClass}
        style={ctaStyle}
      >
        Bridge again
      </button>
    )
  } else if (running) {
    cta = (
      <button type="button" disabled className={ctaClass} style={ctaStyle}>
        <Loader2 className="size-4 animate-spin" /> Bridging...
      </button>
    )
  } else if (transfer.canRetry) {
    cta = (
      <button type="button" onClick={() => void transfer.retry()} className={ctaClass} style={ctaStyle}>
        Resume transfer
      </button>
    )
  } else if (wrongChain) {
    cta = (
      <button
        type="button"
        disabled={switching}
        onClick={() => switchChain({ chainId: from.viem.id })}
        className={ctaClass}
        style={ctaStyle}
      >
        {switching ? 'Switching...' : `Switch to ${from.name}`}
      </button>
    )
  } else {
    const label = !amount
      ? 'Enter an amount'
      : !positive
        ? 'Enter an amount'
        : insufficient
          ? 'Insufficient USDC balance'
          : !recipientValid
            ? 'Fix recipient address'
            : `Bridge ${amount} USDC`
    cta = (
      <button
        type="button"
        disabled={!positive || insufficient || !recipientValid}
        onClick={submit}
        className={ctaClass}
        style={ctaStyle}
      >
        {label}
      </button>
    )
  }

  const showTracker = transfer.phase !== 'idle'
  const trackerFrom = transfer.current?.fromKey ?? fromKey
  const trackerTo = transfer.current?.toKey ?? toKey

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-24 pt-4">
      <div className="glass relative rounded-3xl p-4 sm:p-5">
        <div className="space-y-2">
          <AmountPanel
            title="From"
            chainKey={fromKey}
            otherKey={toKey}
            onChainChange={changeFrom}
            balance={fromBalance.balance}
            balanceLoading={fromBalance.isLoading}
            connected={isConnected}
            amount={amount}
            onAmountChange={setAmount}
            onMax={() => fromBalance.balance && setAmount(fromBalance.balance.toString())}
            disabled={locked}
          />

          <div className="relative z-10 -my-4 flex justify-center">
            <button
              type="button"
              onClick={swapSides}
              disabled={locked}
              aria-label="Swap source and destination chains"
              className="flex size-11 items-center justify-center rounded-full transition-transform hover:rotate-180 disabled:opacity-40"
              style={{ background: '#13243b', border: '1px solid var(--border-strong)', color: 'var(--accent)' }}
            >
              <ArrowDown className="size-4" />
            </button>
          </div>

          <AmountPanel
            title="To"
            chainKey={toKey}
            otherKey={fromKey}
            onChainChange={changeTo}
            balance={toBalance.balance}
            balanceLoading={toBalance.isLoading}
            connected={isConnected}
            amount={receive}
            readOnlyHint={estimate.loading ? 'Quoting fees...' : receive ? 'You receive (est.)' : 'You receive'}
            disabled={locked}
          />
        </div>

        {positive && !showTracker && (
          <dl className="mt-4 space-y-2 px-1 text-sm" aria-live="polite">
            {estimate.lines.map((line) => (
              <div key={`${line.label}-${line.token}`} className="flex justify-between gap-4">
                <dt style={{ color: 'var(--subtle)' }}>{line.label}</dt>
                <dd className="tabular-nums">
                  {line.amount} {line.token}
                </dd>
              </div>
            ))}
            {estimate.error && (
              <div className="text-xs" style={{ color: 'var(--subtle)' }}>
                Fee quote unavailable right now. You will see wallet gas before confirming.
              </div>
            )}
            {wrongChain && !estimate.error && estimate.lines.length === 0 && (
              <div className="text-xs" style={{ color: 'var(--subtle)' }}>
                Switch to {from.name} to quote fees.
              </div>
            )}
          </dl>
        )}

        {showTracker && (
          <div className="mt-4">
            <StepTracker
              phase={transfer.phase}
              steps={transfer.steps}
              fromKey={trackerFrom}
              toKey={trackerTo}
              forwarded={transfer.current?.useForwarder ?? useForwarder}
            />
          </div>
        )}

        {transfer.phase === 'success' && (
          <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--success)' }} role="status">
            Transfer complete. USDC arrived on {chainByKey(trackerTo).name}.
          </p>
        )}
        {transfer.error && (
          <p className="mt-3 text-sm" style={{ color: 'var(--danger)' }} role="alert">
            {transfer.error}
          </p>
        )}

        <div className="mt-3">
          <OptionsPanel
            speed={speed}
            onSpeedChange={setSpeed}
            useForwarder={useForwarder}
            onForwarderChange={setUseForwarder}
            recipient={recipient}
            onRecipientChange={setRecipient}
            disabled={locked}
          />
        </div>

        <div className="mt-3">{cta}</div>

        {isConnected && fromBalance.balance?.raw === 0n && (
          <p className="mt-3 text-center text-xs" style={{ color: 'var(--subtle)' }}>
            No USDC on {from.name}. Use Get test USDC in the Arc Studio sidebar to fund your wallet on Arc Testnet.
          </p>
        )}
      </div>

      <History records={records} />
    </main>
  )
}
