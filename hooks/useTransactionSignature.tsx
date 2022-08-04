import type { TransactionSignature } from '@solana/web3.js'
import { Connection, PublicKey } from '@solana/web3.js'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useQuery } from 'react-query'

export const useTransactionSignature = (
  tokenManagerId: string | undefined,
  stateChangedAt: number | undefined,
  enabled = false
) => {
  const { environment } = useEnvironmentCtx()
  const connection = new Connection(environment.primary, {
    commitment: 'confirmed',
  })
  const maxIterations = 3

  return useQuery<string | undefined>(
    ['useTransactionSignature', tokenManagerId?.toString(), stateChangedAt],
    async () => {
      if (!tokenManagerId || !stateChangedAt) return
      let lastSignature: TransactionSignature | undefined
      const stateChanged = Math.floor(new Date(stateChangedAt, { }).getTime() / 1000)
      console.log(stateChangedAt, stateChanged)

      console.log(tokenManagerId)
      for (let i = 0; i < maxIterations; i++) {
        const confirmedSignatures =
          await connection.getConfirmedSignaturesForAddress2(
            new PublicKey(tokenManagerId),
            { before: lastSignature },
            'confirmed'
          )
        const found = confirmedSignatures.find((sig) => {
          console.log(
            stateChangedAt,
            sig.blockTime,
            sig.signature,
            new Date(sig.blockTime * 1000).toLocaleString(),
            new Date(stateChanged * 1000).toLocaleString()
          )
          return sig.blockTime && sig.blockTime <= stateChanged - 100000
        })
        if (found) return found.signature

        lastSignature =
          confirmedSignatures[confirmedSignatures.length - 1]?.signature
      }
    },
    {
      enabled: enabled,
    }
  )
}
