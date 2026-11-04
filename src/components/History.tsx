import { ArrowRight, ExternalLink } from 'lucide-react'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { chainByKey } from '@/lib/chains'
import { ChainIcon } from '@/components/ChainIcon'
import type { TransferRecord } from '@/hooks/useHistory'

export function History({ records }: { records: TransferRecord[] }) {
  if (records.length === 0) return null

  return (
    <section className="glass mt-4 rounded-3xl p-5" aria-label="Recent transfers">
      <h2
        className="mb-3 text-xs font-semibold uppercase"
        style={{ color: 'var(--subtle)', letterSpacing: '0.08em' }}
      >
        Recent transfers
      </h2>
      <ul className="space-y-2">
        {records.map((record) => {
          const from = chainByKey(record.from)
          const to = chainByKey(record.to)
          const failed = record.state !== 'success'
          return (
            <li key={record.id} className="glass-inner flex items-center gap-3 rounded-2xl px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <ChainIcon slug={from.slug} size={20} />
                <ArrowRight className="size-3.5" style={{ color: 'var(--subtle)' }} />
                <ChainIcon slug={to.slug} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold tabular-nums">{record.amount} USDC</div>
                <div className="text-xs" style={{ color: failed ? 'var(--danger)' : 'var(--subtle)' }}>
                  {failed ? 'Incomplete' : 'Completed'} · {new Date(record.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {record.burnTx && (
                  <a
                    href={buildTxExplorerUrl(record.fromChainId, record.burnTx)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold hover:bg-white/10"
                    style={{ color: 'var(--accent)' }}
                  >
                    Burn <ExternalLink className="size-3" />
                  </a>
                )}
                {record.mintTx && (
                  <a
                    href={buildTxExplorerUrl(record.toChainId, record.mintTx)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold hover:bg-white/10"
                    style={{ color: 'var(--accent)' }}
                  >
                    Mint <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
