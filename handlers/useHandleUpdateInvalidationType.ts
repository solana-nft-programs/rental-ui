import { updateMaxExpiration } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/instruction'
import type { InvalidationType } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { updateInvalidationType } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/instruction'
import type { BN } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
import { logConfigTokenDataEvent } from 'apis/amplitude'
import {
  getPriceFromTokenData,
  getTokenRentalRate,
} from 'common/tokenDataUtils'
import { tracer, withTrace } from 'common/trace'
import { executeTransaction } from 'common/Transactions'
import { asWallet } from 'common/Wallets'
import { TOKEN_DATA_KEY } from 'hooks/useBrowseAvailableTokenDatas'
import { PAYMENT_MINTS, usePaymentMints } from 'hooks/usePaymentMints'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useMutation, useQueryClient } from 'react-query'

import type { TokenData } from './../apis/api'

export const useHandleUpdateInvalidationType = () => {
  const wallet = useWallet()
  const { connection } = useEnvironmentCtx()
  const queryClient = useQueryClient()
  const { config } = useProjectConfig()
  const paymentMints = usePaymentMints()
  return useMutation(
    async ({
      tokenData,
      newInvalidationType,
      newMaxExpiration,
    }: {
      tokenData: Pick<TokenData, 'tokenManager' | 'timeInvalidator'>
      newInvalidationType: InvalidationType
      newMaxExpiration?: BN
    }): Promise<string> => {
      const tokenManager = tokenData.tokenManager
      const timeInvalidator = tokenData.timeInvalidator
      if (!tokenManager) throw 'Token manager not found'
      if (newMaxExpiration && !timeInvalidator)
        throw 'Time invalidator not found'
      if (!wallet.publicKey) throw 'Wallet not connected'
      const transaction = new Transaction()
      const trace = tracer({ name: 'useHandleUpdateMaxExpiration' })

      transaction.add(
        updateInvalidationType(
          connection,
          asWallet(wallet),
          tokenManager.pubkey,
          newInvalidationType
        )
      )

      if (newMaxExpiration) {
        transaction.add(
          updateMaxExpiration(
            connection,
            asWallet(wallet),
            timeInvalidator!.pubkey,
            tokenManager.pubkey,
            newMaxExpiration
          )
        )
      }

      const tx = await withTrace(
        () =>
          executeTransaction(connection, asWallet(wallet), transaction, {
            confirmOptions: {
              commitment: 'confirmed',
              maxRetries: 3,
              skipPreflight: true,
            },
            notificationConfig: {},
          }),
        trace,
        { op: 'executeTransaction' }
      )
      logConfigTokenDataEvent(
        `nft update: updateInvalidationType`,
        config,
        tokenData as TokenData,
        {
          rental_type: 'rate',
          rental_rate: getTokenRentalRate(
            config,
            paymentMints.data ?? {},
            tokenData as TokenData
          )?.rate,
          rental_rate_text: getTokenRentalRate(
            config,
            paymentMints.data ?? {},
            tokenData as TokenData
          )?.displayText,
          issuer_id: tokenData.tokenManager?.parsed.issuer.toString(),
          recipient_id: wallet.publicKey?.toString(),
          duration_seconds:
            tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber(),
          expiration_timestamp:
            tokenData.timeInvalidator?.parsed.expiration?.toNumber(),
          max_expiration:
            tokenData.timeInvalidator?.parsed.maxExpiration?.toNumber(),
          new_invalidation_type: newInvalidationType.toString(),
          rental_price: getPriceFromTokenData(
            tokenData as TokenData,
            paymentMints.data
          ),
          extension_payment_mint: PAYMENT_MINTS.filter(
            (mint) =>
              mint.mint ===
              tokenData.timeInvalidator?.parsed.extensionPaymentMint?.toString()
          )[0]?.symbol,
        }
      )
      trace.finish()
      return tx
    },
    {
      onError: async (e) => {
        console.log('[error][useHandleUpdateInvalidationType]', e)
        return e
      },
      onSuccess: () => {
        queryClient.resetQueries(TOKEN_DATA_KEY)
      },
    }
  )
}
