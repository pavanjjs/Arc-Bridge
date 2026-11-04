import { useAccount, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { usdcAddress } from '@/lib/chains'
import { Amount, usdcDecimalsFor } from '@/onchain-money'

/** Live ERC-20 USDC balance (the single USDC view, 6 decimals) on a specific chain. */
export function useUsdcBalance(chainId: number) {
  const { address } = useAccount()
  const token = usdcAddress(chainId)

  const query = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: Boolean(address && token), refetchInterval: 15_000 },
  })

  const balance =
    query.data !== undefined ? Amount.fromRaw(query.data, usdcDecimalsFor(chainId)) : undefined

  return {
    balance,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
