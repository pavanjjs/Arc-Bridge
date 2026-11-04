import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { isAddress } from 'viem'
import type { BridgeSpeed } from '@/lib/kit'

interface Props {
  speed: BridgeSpeed
  onSpeedChange: (speed: BridgeSpeed) => void
  useForwarder: boolean
  onForwarderChange: (value: boolean) => void
  recipient: string
  onRecipientChange: (value: string) => void
  disabled?: boolean
}

export function OptionsPanel({
  speed,
  onSpeedChange,
  useForwarder,
  onForwarderChange,
  recipient,
  onRecipientChange,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false)
  const recipientInvalid = recipient.length > 0 && !isAddress(recipient)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between rounded-xl px-1 text-sm font-semibold"
        style={{ color: 'var(--muted)' }}
      >
        Transfer options
        <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <fieldset disabled={disabled} className="mt-2 space-y-4 border-0 p-0">
          <div>
            <legend className="mb-2 text-xs font-semibold uppercase" style={{ color: 'var(--subtle)', letterSpacing: '0.08em' }}>
              Speed
            </legend>
            <div className="glass-inner grid grid-cols-2 gap-1 rounded-2xl p-1" role="radiogroup" aria-label="Transfer speed">
              {(
                [
                  { id: 'FAST', title: 'Fast', hint: 'Seconds, small fee' },
                  { id: 'SLOW', title: 'Standard', hint: 'Minutes, no fast fee' },
                ] as const
              ).map((option) => {
                const active = speed === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onSpeedChange(option.id)}
                    className="min-h-11 rounded-xl px-3 py-2 text-left transition-colors"
                    style={{
                      background: active ? 'var(--surface-strong)' : 'transparent',
                      border: `1px solid ${active ? 'var(--border-strong)' : 'transparent'}`,
                    }}
                  >
                    <span className="block text-sm font-semibold">{option.title}</span>
                    <span className="block text-xs" style={{ color: 'var(--subtle)' }}>
                      {option.hint}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <label className="glass-inner flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl p-3">
            <input
              type="checkbox"
              checked={useForwarder}
              onChange={(event) => onForwarderChange(event.target.checked)}
              className="mt-0.5 size-4 accent-[#acc6e9]"
            />
            <span>
              <span className="block text-sm font-semibold">Auto-deliver on destination</span>
              <span className="block text-xs" style={{ color: 'var(--subtle)' }}>
                Circle submits the mint for you, so your wallet never switches to the destination chain. A forwarding fee applies.
              </span>
            </span>
          </label>

          <div>
            <label htmlFor="recipient" className="mb-2 block text-xs font-semibold uppercase" style={{ color: 'var(--subtle)', letterSpacing: '0.08em' }}>
              Recipient (optional)
            </label>
            <input
              id="recipient"
              value={recipient}
              onChange={(event) => onRecipientChange(event.target.value.trim())}
              placeholder="0x... defaults to your wallet"
              spellCheck={false}
              className="glass-inner mono min-h-11 w-full rounded-xl bg-transparent px-3 text-sm outline-none placeholder:text-slate-500"
              style={{ borderColor: recipientInvalid ? 'var(--danger)' : undefined }}
            />
            {recipientInvalid && (
              <p className="mt-1.5 text-xs" style={{ color: 'var(--danger)' }}>
                Enter a valid EVM address.
              </p>
            )}
          </div>
        </fieldset>
      )}
    </div>
  )
}
