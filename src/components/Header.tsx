import { ConnectKitButton } from 'connectkit'
import { Wallet } from 'lucide-react'

export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-xl items-center justify-between px-4 pb-2 pt-6">
      <div>
        <h1 className="display text-2xl font-bold">Arc Bridge</h1>
        <p className="text-xs" style={{ color: 'var(--subtle)' }}>
          Move USDC across chains with Circle CCTP
        </p>
      </div>
      <ConnectKitButton.Custom>
        {({ isConnected, show, truncatedAddress }) => (
          <button
            type="button"
            onClick={show}
            className="glass-inner flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors hover:bg-white/10"
          >
            <Wallet className="size-4" style={{ color: 'var(--accent)' }} />
            <span className="mono">{isConnected ? truncatedAddress : 'Connect'}</span>
          </button>
        )}
      </ConnectKitButton.Custom>
    </header>
  )
}
