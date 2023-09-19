import type { BN } from '@coral-xyz/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
import { timeInvalidatorProgram } from '@solana-nft-programs/token-manager/dist/cjs/programs/timeInvalidator'
import { findTimeInvalidatorAddress } from '@solana-nft-programs/token-manager/dist/cjs/programs/timeInvalidator/pda'
import type { InvalidationType } from '@solana-nft-programs/token-manager/dist/cjs/programs/tokenManager'
import { tokenManagerProgram } from '@solana-nft-programs/token-manager/dist/cjs/programs/tokenManager'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notify } from 'common/Notification'
import {
  getPriceFromTokenData,
  getTokenRentalRate,
} from 'common/tokenDataUtils'
import { executeTransaction } from 'common/Transactions'
import { asWallet } from 'common/Wallets'
import { TOKEN_DATA_KEY } from 'hooks/useBrowseAvailableTokenDatas'
import { PAYMENT_MINTS, usePaymentMints } from 'hooks/usePaymentMints'
import { logConfigTokenDataEvent } from 'monitoring/amplitude'
import { tracer, withTrace } from 'monitoring/trace'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

import type { TokenData } from './../data/data'

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
        await tokenManagerProgram(connection)
          .methods.updateInvalidationType(newInvalidationType)
          .accountsStrict({
            tokenManager: tokenManager.pubkey,
            issuer: wallet.publicKey,
          })
          .instruction()
      )

      if (newMaxExpiration) {
        transaction.add(
          await timeInvalidatorProgram(connection)
            .methods.updateMaxExpiration({ newMaxExpiration })
            .accountsStrict({
              timeInvalidator: findTimeInvalidatorAddress(tokenManager.pubkey),
              tokenManager: tokenManager.pubkey,
              issuer: wallet.publicKey,
            })
            .instruction()
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
        notify({
          message: `Failed to update invalidation type`,
          description: `${e}`,
        })
        return e
      },
      onSuccess: () => {
        queryClient.resetQueries([TOKEN_DATA_KEY])
      },
    }
  )
}
