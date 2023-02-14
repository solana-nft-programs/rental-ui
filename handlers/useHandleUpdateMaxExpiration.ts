import { withUpdateMaxExpiration } from '@cardinal/token-manager'
import type { BN } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
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
import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { TokenData } from './../apis/api'

export const useHandleUpdateMaxExpiration = () => {
  const wallet = useWallet()
  const { connection } = useEnvironmentCtx()
  const queryClient = useQueryClient()
  const { config } = useProjectConfig()
  const paymentMints = usePaymentMints()
  return useMutation(
    async ({
      tokenData,
      maxExpiration,
    }: {
      tokenData: Pick<TokenData, 'tokenManager' | 'timeInvalidator'>
      maxExpiration: BN | undefined
    }): Promise<string> => {
      const tokenManager = tokenData.tokenManager
      if (!tokenManager) throw 'Token manager not found'
      if (!maxExpiration) throw 'No max expiration specified'
      if (!wallet.publicKey) throw 'Wallet not connected'
      const transaction = new Transaction()
      const trace = tracer({ name: 'useHandleUpdateMaxExpiration' })

      await withTrace(
        () =>
          withUpdateMaxExpiration(
            transaction,
            connection,
            asWallet(wallet),
            tokenManager.pubkey,
            maxExpiration
          ),
        trace,
        { op: 'withExtendExpiration' }
      )

      const tx = await withTrace(
        () =>
          executeTransaction(connection, asWallet(wallet), transaction, {
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
        `nft update: updateMaxExpiration`,
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
          new_max_expiration: maxExpiration.toNumber(),
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
        console.log('[error][useHandleUpdateMaxExpiration]', e)
        return e
      },
      onSuccess: () => {
        queryClient.resetQueries(TOKEN_DATA_KEY)
      },
    }
  )
}
