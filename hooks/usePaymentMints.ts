import { web3 } from '@project-serum/anchor'
import * as splToken from '@solana/spl-token'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useQuery } from 'react-query'

export const PAYMENT_MINTS = [
  {
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
  },
  {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
  },
  {
    mint: '2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8',
    symbol: 'USDC',
  },
]

export const WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112'

export const usePaymentMints = () => {
  const ctx = useEnvironmentCtx()

  return useQuery<{ [name: string]: splToken.MintInfo }>(
    ['usePaymentMints'],
    async () => {
      const paymentMintInfoMap: { [k: string]: splToken.MintInfo } = {}
      for (let i = 0; i < PAYMENT_MINTS.length; i++) {
        try {
          const paymentToken = new splToken.Token(
            ctx.connection,
            new web3.PublicKey(PAYMENT_MINTS[i]!.mint),
            splToken.TOKEN_PROGRAM_ID,
            // @ts-ignore
            null
          )
          const mintInfo = await paymentToken.getMintInfo()
          paymentMintInfoMap[PAYMENT_MINTS[i]!.mint] = mintInfo
        } catch (e: any) {
          console.log(`${e}`)
        }
      }
      return paymentMintInfoMap
    }
  )
}
