import { useQuery } from 'react-query'

export type PaymentMintInfo = {
  mint: string
  symbol: string
  image?: string
  decimals: number
}

export const PAYMENT_MINTS: PaymentMintInfo[] = [
  {
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    decimals: 9,
  },
  {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    image:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    decimals: 6,
  },
  {
    mint: 'MLKmUCaj1dpBY881aFsrBwR9RUMoKic8SWT3u1q5Nkj',
    symbol: 'MILK',
    image:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/MLKmUCaj1dpBY881aFsrBwR9RUMoKic8SWT3u1q5Nkj/logo.png',
    decimals: 9,
  },
  {
    mint: 'FdviznPoMEakdJ37fikNxhoscyruUHSHNkKyvntSqbuo',
    symbol: 'CATNIP',
    image:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/FdviznPoMEakdJ37fikNxhoscyruUHSHNkKyvntSqbuo/logo.png',
    decimals: 9,
  },
]

export const WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112'

export const usePaymentMints = () => {
  return useQuery<{
    [name: string]: PaymentMintInfo
  }>(
    ['usePaymentMints'],
    async () => {
      return Object.fromEntries(PAYMENT_MINTS.map((data) => [data.mint, data]))
    },
    {
      refetchOnMount: false,
    }
  )
}
