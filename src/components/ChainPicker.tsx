import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { BRIDGE_CHAINS, chainByKey, type BridgeChainKey } from '@/lib/chains'
import { ChainIcon } from '@/components/ChainIcon'

interface Props {
  value: BridgeChainKey
  /** Chain that cannot be picked here (the other side of the bridge). */
  disabledKey: BridgeChainKey
  onChange: (key: BridgeChainKey) => void
  label: string
}

export function ChainPicker({ value, disabledKey, onChange, label }: Props) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const selected = chainByKey(value)

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selected.name}`}
        onClick={() => setOpen((o) => !o)}
        className="glass-inner flex min-h-11 items-center gap-2 rounded-full py-1.5 pl-2 pr-3 text-sm font-semibold transition-colors hover:bg-white/10"
      >
        <ChainIcon slug={selected.slug} size={22} />
        <span>{selected.name}</span>
        <ChevronDown className="size-4" style={{ color: 'var(--subtle)' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-30 mt-2 max-h-72 w-64 overflow-auto rounded-2xl p-1.5 shadow-2xl"
            style={{ background: '#13243b', border: '1px solid var(--border)' }}
          >
            {BRIDGE_CHAINS.map((chain) => {
              const disabled = chain.key === disabledKey
              const active = chain.key === value
              return (
                <li key={chain.key} role="option" aria-selected={active} aria-disabled={disabled}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(chain.key)
                      setOpen(false)
                    }}
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChainIcon slug={chain.slug} size={22} />
                    <span className="flex-1">{chain.name}</span>
                    {active && <Check className="size-4" style={{ color: 'var(--success)' }} />}
                  </button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
