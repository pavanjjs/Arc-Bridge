import { TokenUSDC } from '@web3icons/react'
import type { Amount } from '@/onchain-money'
import { ChainPicker } from '@/components/ChainPicker'
import type { BridgeChainKey } from '@/lib/chains'

interface Props {
  title: string
  chainKey: BridgeChainKey
  otherKey: BridgeChainKey
  onChainChange: (key: BridgeChainKey) => void
  balance: Amount | undefined
  balanceLoading: boolean
  connected: boolean
  /** Editable amount (source) or a read-only value (destination). */
  amount: string
  onAmountChange?: (value: string) => void
  onMax?: () => void
  readOnlyHint?: string
  disabled?: boolean
}

export function AmountPanel({
  title,
  chainKey,
  otherKey,
  onChainChange,
  balance,
  balanceLoading,
  connected,
  amount,
  onAmountChange,
  onMax,
  readOnlyHint,
  disabled,
}: Props) {
  const editable = Boolean(onAmountChange)
  const balanceText = !connected
    ? 'Connect wallet'
    : balanceLoading
      ? 'Loading balance...'
      : balance
        ? `Balance: ${balance.toFixed(2)}`
        : 'Balance unavailable'

  return (
    <section className="glass-inner rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase" style={{ color: 'var(--subtle)', letterSpacing: '0.08em' }}>
          {title}
        </span>
        <ChainPicker value={chainKey} disabledKey={otherKey} onChange={onChainChange} label={title} />
      </div>

      <div className="flex items-center gap-3">
        {editable ? (
          <input
            inputMode="decimal"
            aria-label={`${title} amount in USDC`}
            value={amount}
            disabled={disabled}
            placeholder="0.00"
            onChange={(event) => {
              const value = event.target.value
              if (value === '' || /^\d*\.?\d{0,6}$/.test(value)) onAmountChange?.(value)
            }}
            className="display min-w-0 flex-1 bg-transparent text-4xl font-bold tabular-nums outline-none placeholder:text-slate-500 disabled:opacity-60"
            style={{ color: 'var(--ink)' }}
          />
        ) : (
          <output
            aria-label={`${title} amount in USDC`}
            className="display min-w-0 flex-1 truncate text-4xl font-bold tabular-nums"
            style={{ color: amount ? 'var(--ink)' : '#64748b' }}
          >
            {amount || '0.00'}
          </output>
        )}
        <div className="flex shrink-0 items-center gap-1.5 text-sm font-semibold">
          <TokenUSDC variant="branded" size={22} />
          USDC
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs" style={{ color: 'var(--subtle)' }}>
        <span className="tabular-nums">{readOnlyHint && !editable ? readOnlyHint : balanceText}</span>
        {editable && (
          <button
            type="button"
            disabled={!balance || disabled}
            onClick={onMax}
            className="min-h-8 rounded-full px-3 font-semibold transition-colors hover:bg-white/10 disabled:opacity-40"
            style={{ color: 'var(--accent)' }}
          >
            Max
          </button>
        )}
        {!editable && readOnlyHint && <span className="tabular-nums">{balanceText}</span>}
      </div>
    </section>
  )
}
