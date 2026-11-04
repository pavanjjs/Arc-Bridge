import { useCallback, useState } from 'react'
import type { BridgeChainKey } from '@/lib/chains'

export interface TransferRecord {
  id: string
  timestamp: number
  amount: string
  from: BridgeChainKey
  to: BridgeChainKey
  fromChainId: number
  toChainId: number
  state: 'success' | 'error' | 'pending'
  burnTx?: string
  mintTx?: string
  recipient: string
}

const STORAGE_PREFIX = 'arc-bridge-history:'
const MAX_RECORDS = 20

function read(key: string): TransferRecord[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as TransferRecord[]) : []
  } catch {
    return []
  }
}

/** Per-wallet record of transfers made from this browser. */
export function useHistory(address: string | undefined) {
  const storageKey = address ? `${STORAGE_PREFIX}${address.toLowerCase()}` : undefined
  // Cache of the last snapshot, tagged with the key it belongs to, so a wallet switch never shows stale rows.
  const [snapshot, setSnapshot] = useState<{ key: string; records: TransferRecord[] } | null>(null)

  const records =
    storageKey === undefined ? [] : snapshot?.key === storageKey ? snapshot.records : read(storageKey)

  const save = useCallback(
    (record: TransferRecord) => {
      if (!storageKey) return
      const next = [record, ...read(storageKey).filter((r) => r.id !== record.id)].slice(0, MAX_RECORDS)
      localStorage.setItem(storageKey, JSON.stringify(next))
      setSnapshot({ key: storageKey, records: next })
    },
    [storageKey],
  )

  return { records, save }
}
