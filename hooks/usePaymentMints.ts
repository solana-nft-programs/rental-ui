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
    mint: 'Gbi4F6tEUz7sucsUfyjS28W5Ssd8jiGgdw6hB8XZGJke',
    symbol: 'DEGEN',
    image: 'https://arweave.net/Ehsfm_gcjIiRgebVlzVYG9ank4Y3Fi0aM_dQHS87kis',
    decimals: 6,
  },
  {
    mint: 'FdviznPoMEakdJ37fikNxhoscyruUHSHNkKyvntSqbuo',
    symbol: 'CATNIP',
    image:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/FdviznPoMEakdJ37fikNxhoscyruUHSHNkKyvntSqbuo/logo.png',
    decimals: 9,
  },
  {
    mint: 'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ',
    symbol: 'DUST',
    image:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ/logo.jpg',
    decimals: 9,
  },
  {
    mint: 'GkywroLpkvYQc5dmFfd2RchVYycXZdaA5Uzix42iJdNo',
    symbol: 'DROID',
    image:
      'https://raw.githubusercontent.com/LinYu1992/Droid_Capital_Token/main/Droid_coin_tiny_1.png',
    decimals: 9,
  },
  {
    mint: '7BPCwgL97UMWcSuyUmDdNTzGnDvruyfGKTmUaSbLzohP',
    symbol: 'CHEF',
    image: 'https://metakitchen.io/static/media/mk.66f4827037442397afe6.jpeg',
    decimals: 0,
  },
  {
    mint: '8o66EVAf4u2Hr21m2tuRrPtEXFPLr8G8aL1ETStP8fDu',
    symbol: 'VIBE',
    image:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/8o66EVAf4u2Hr21m2tuRrPtEXFPLr8G8aL1ETStP8fDu/VIBE-logo.png',
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
