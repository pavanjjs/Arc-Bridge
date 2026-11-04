import { Check, ExternalLink, Loader2 } from 'lucide-react'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { STEP_ORDER, type Phase, type StepName, type StepProgress } from '@/hooks/useBridgeTransfer'
import { chainByKey, type BridgeChainKey } from '@/lib/chains'

interface Props {
  phase: Phase
  steps: Record<StepName, StepProgress>
  fromKey: BridgeChainKey
  toKey: BridgeChainKey
  forwarded: boolean
}

export function StepTracker({ phase, steps, fromKey, toKey, forwarded }: Props) {
  const from = chainByKey(fromKey)
  const to = chainByKey(toKey)

  const labels: Record<StepName, { title: string; chainId: number }> = {
    approve: { title: 'Approve USDC', chainId: from.viem.id },
    burn: { title: `Burn on ${from.name}`, chainId: from.viem.id },
    fetchAttestation: { title: 'Circle attestation', chainId: from.viem.id },
    mint: { title: forwarded ? `Circle forwards mint on ${to.name}` : `Mint on ${to.name}`, chainId: to.viem.id },
  }

  const activeIndex = STEP_ORDER.findIndex((name) => !steps[name].done)

  return (
    <ol className="glass-inner space-y-1 rounded-2xl p-3" aria-label="Bridge progress">
      {STEP_ORDER.map((name, index) => {
        const step = steps[name]
        const active = phase === 'running' && index === activeIndex
        const url = step.txHash ? buildTxExplorerUrl(labels[name].chainId, step.txHash) : step.explorerUrl
        return (
          <li key={name} className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-1.5">
            <span
              className="flex size-6 shrink-0 items-center justify-center rounded-full"
              style={{
                background: step.done ? 'rgba(141,216,159,0.16)' : 'rgba(255,255,255,0.06)',
                color: step.done ? 'var(--success)' : 'var(--subtle)',
              }}
            >
              {step.done ? (
                <Check className="size-3.5" />
              ) : active ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <span className="text-xs font-semibold tabular-nums">{index + 1}</span>
              )}
            </span>
            <span
              className="flex-1 text-sm font-medium"
              style={{ color: step.done || active ? 'var(--ink)' : 'var(--subtle)' }}
            >
              {labels[name].title}
              {name === 'fetchAttestation' && active && (
                <span className="block text-xs font-normal" style={{ color: 'var(--subtle)' }}>
                  Waiting for Circle to sign the burn
                </span>
              )}
            </span>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${labels[name].title} transaction`}
                className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                style={{ color: 'var(--accent)' }}
              >
                <ExternalLink className="size-4" />
              </a>
            )}
          </li>
        )
      })}
    </ol>
  )
}
