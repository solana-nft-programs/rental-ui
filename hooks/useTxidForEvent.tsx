import type { TransactionSignature } from '@solana/web3.js'
import { Connection, PublicKey } from '@solana/web3.js'
import { tracer, withTrace } from 'monitoring/trace'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useQuery } from '@tanstack/react-query'

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
      const trace = tracer({ name: `[useTransactionSignature]` })
      for (let i = 0; i < maxIterations; i++) {
        const confirmedSignatures = await withTrace(
          () =>
            connection.getConfirmedSignaturesForAddress2(
              new PublicKey(tokenManagerId),
              { before: lastSignature },
              'confirmed'
            ),
          trace,
          { op: `[getConfirmedSignaturesForAddress2] - ${i}` }
        )
        const foundIndex = confirmedSignatures.findIndex((sig) => {
          return sig.blockTime && sig.blockTime <= stateChanged
        })
        if (foundIndex !== -1) {
          const closestSignature = [
            foundIndex > 0 ? confirmedSignatures[foundIndex - 1] : null,
            confirmedSignatures[foundIndex],
            foundIndex < confirmedSignatures.length - 1
              ? confirmedSignatures[foundIndex + 1]
              : null,
          ]
          trace.finish()
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
