import { withResetExpiration, withReturn } from '@cardinal/token-manager'
import { useWallet } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { executeTransaction } from 'common/Transactions'
import { asWallet } from 'common/Wallets'
import { TOKEN_DATA_KEY } from 'hooks/useBrowseAvailableTokenDatas'
import { logConfigTokenDataEvent } from 'monitoring/amplitude'
import { tracer, withTrace } from 'monitoring/trace'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useMutation, useQueryClient } from 'react-query'

export interface HandleIssueRentalParams {
  tokenData: TokenData
}

export const useHandleReturnRental = () => {
  const wallet = useWallet()
  const { connection } = useEnvironmentCtx()
  const queryClient = useQueryClient()
  const { configFromToken } = useProjectConfig()
  return useMutation(
    async ({ tokenData }: HandleIssueRentalParams): Promise<string> => {
      if (!tokenData.tokenManager) throw new Error('Invalid token manager')
      if (!wallet.publicKey) throw new Error('Wallet not connected')

      const transaction = new Transaction()
      const trace = tracer({ name: 'useHandleReturnRental' })

      await withTrace(
        () =>
          withReturn(
            transaction,
            connection,
            asWallet(wallet),
            tokenData.tokenManager!
          ),
        trace,
        { op: 'withReturn' }
      )

      if (tokenData.timeInvalidator) {
        await withTrace(
          () =>
            withResetExpiration(
              transaction,
              connection,
              asWallet(wallet),
              tokenData.tokenManager!.pubkey
            ),
          trace,
          { op: 'withResetExpiration' }
        )
      }

      const tx = withTrace(
        () =>
          executeTransaction(connection, asWallet(wallet), transaction, {
            silent: false,
            confirmOptions: {
              commitment: 'confirmed',
              maxRetries: 3,
            },
            notificationConfig: {},
          }),
        trace,
        { op: 'executeTransaction' }
      )
      logConfigTokenDataEvent(
        'nft rental: return',
        configFromToken(tokenData),
        tokenData,
        {
          duration_seconds:
            tokenData.timeInvalidator?.parsed?.durationSeconds?.toNumber(),
          expiration: tokenData.timeInvalidator?.parsed?.expiration?.toNumber(),
          max_expiration:
            tokenData.timeInvalidator?.parsed?.maxExpiration?.toNumber(),
        }
      )
      trace.finish()
      return tx
    },
    {
      onSuccess: () => {
        queryClient.resetQueries(TOKEN_DATA_KEY)
      },
    }
  )
}
