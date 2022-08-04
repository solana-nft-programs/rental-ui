import type { TransactionSignature } from '@solana/web3.js'
import { Connection, PublicKey } from '@solana/web3.js'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useQuery } from 'react-query'

export const useTxidForEvent = (
  tokenManagerId: string | undefined,
  stateChangedAt: string | undefined,
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
      const stateChanged = Math.floor(new Date(stateChangedAt).getTime() / 1000)
      for (let i = 0; i < maxIterations; i++) {
        const confirmedSignatures =
          await connection.getConfirmedSignaturesForAddress2(
            new PublicKey(tokenManagerId),
            { before: lastSignature },
            'confirmed'
          )
        const foundIndex = confirmedSignatures.findIndex((sig) => {
          return sig.blockTime && sig.blockTime <= stateChanged
        })
        if (foundIndex) {
          const closestSignature = [
            confirmedSignatures[foundIndex - 1],
            confirmedSignatures[foundIndex],
            confirmedSignatures[foundIndex + 1],
          ]
          return closestSignature.sort(
            (a, b) =>
              Math.abs((a?.blockTime ?? 0) - stateChanged) -
              Math.abs((b?.blockTime ?? 0) - stateChanged)
          )[0]?.signature
        }
        lastSignature =
          confirmedSignatures[confirmedSignatures.length - 1]?.signature
      }
    },
    {
      enabled: enabled,
    }
  )
}
