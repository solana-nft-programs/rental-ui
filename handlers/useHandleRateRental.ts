import type { AccountData } from '@cardinal/common'
import {
  withFindOrInitAssociatedTokenAccount,
  withWrapSol,
} from '@cardinal/common'
import {
  withClaimToken,
  withExtendExpiration,
  withResetExpiration,
} from '@cardinal/token-manager'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import type { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import type * as splToken from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import type { Keypair } from '@solana/web3.js'
import { Connection, Transaction } from '@solana/web3.js'
import { BN } from 'bn.js'
import { getExtensionPrice } from 'common/RentalSummary'
import {
  getPriceFromTokenData,
  getTokenRentalRate,
} from 'common/tokenDataUtils'
import { executeTransaction } from 'common/Transactions'
import { asWallet } from 'common/Wallets'
import { TOKEN_DATA_KEY } from 'hooks/useBrowseAvailableTokenDatas'
import {
  PAYMENT_MINTS,
  usePaymentMints,
  WRAPPED_SOL_MINT,
} from 'hooks/usePaymentMints'
import { logConfigTokenDataEvent } from 'monitoring/amplitude'
import { tracer, withTrace } from 'monitoring/trace'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useMutation, useQueryClient } from 'react-query'

import type { TokenData } from './../apis/api'

export interface HandleRateRentalParams {
  tokenData: {
    claimApprover?: AccountData<PaidClaimApproverData> | null
    tokenManager?: AccountData<TokenManagerData> | null
    timeInvalidator?: AccountData<TimeInvalidatorData> | null
    metaplexData?: AccountData<metaplex.Metadata>
  }
  extensionSeconds: number | undefined | null
  userPaymentTokenAccount?: splToken.AccountInfo
  otpKeypair?: Keypair
  claim?: boolean
}

export const useHandleRateRental = () => {
  const wallet = useWallet()
  const { connection, environment } = useEnvironmentCtx()
  const queryClient = useQueryClient()
  const { config } = useProjectConfig()
  const paymentMints = usePaymentMints()
  return useMutation(
    async ({
      claim,
      tokenData,
      extensionSeconds,
      userPaymentTokenAccount,
      otpKeypair,
    }: HandleRateRentalParams): Promise<string> => {
      const {
        extensionPaymentMint,
        extensionPaymentAmount,
        extensionDurationSeconds,
      } = tokenData.timeInvalidator?.parsed || {}

      if (!tokenData.tokenManager) throw 'Token manager not found'
      if (!extensionSeconds) throw 'No duration specified'
      if (!wallet.publicKey) throw 'Wallet not connected'
      const transaction = new Transaction()
      const trace = tracer({ name: 'useHandleRateRental' })

      // wrap sol if there is payment required
      const paymentAmount =
        (tokenData?.claimApprover?.parsed?.paymentAmount.toNumber() ?? 0) + // parsed can be null for private rental
        ((extensionPaymentAmount?.toNumber() ?? 0) /
          (extensionDurationSeconds?.toNumber() ?? 0)) *
          extensionSeconds
      if (
        extensionPaymentMint?.toString() === WRAPPED_SOL_MINT.toString() &&
        paymentAmount > 0
      ) {
        const amountToWrap =
          paymentAmount - (userPaymentTokenAccount?.amount.toNumber() || 0)
        if (amountToWrap > 0) {
          await withWrapSol(
            transaction,
            connection,
            asWallet(wallet),
            new BN(Math.ceil(amountToWrap)).toNumber()
          )
        }
      }

      if (
        extensionPaymentMint &&
        (extensionPaymentMint?.toString() !== WRAPPED_SOL_MINT.toString() ||
          (transaction.instructions.length === 0 &&
            extensionPaymentMint?.toString() === WRAPPED_SOL_MINT.toString()))
      ) {
        await withFindOrInitAssociatedTokenAccount(
          transaction,
          connection,
          extensionPaymentMint,
          wallet.publicKey,
          wallet.publicKey
        )
      }

      console.log(
        `${claim ? 'Claiming' : 'Extending'} token manager`,
        tokenData
      )
      if (claim) {
        if (tokenData.timeInvalidator) {
          await withResetExpiration(
            transaction,
            connection,
            asWallet(wallet),
            tokenData.tokenManager?.pubkey
          )
        }
        await withTrace(
          () =>
            withClaimToken(
              transaction,
              environment.secondary
                ? new Connection(environment.secondary)
                : connection,
              asWallet(wallet),
              tokenData.tokenManager!.pubkey
            ),
          trace,
          { op: 'withClaimToken' }
        )
      }

      await withTrace(
        () =>
          withExtendExpiration(
            transaction,
            connection,
            asWallet(wallet),
            tokenData.tokenManager!.pubkey,
            extensionSeconds
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
            signers:
              otpKeypair &&
              tokenData?.tokenManager!.parsed.claimApprover?.equals(
                otpKeypair.publicKey
              )
                ? [otpKeypair]
                : [],
            notificationConfig: {},
          }),
        trace,
        { op: 'executeTransaction' }
      )
      logConfigTokenDataEvent(
        `nft rental: ${claim ? 'claim' : 'extend duration'}`,
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
          is_claim: claim,
          issuer_id: tokenData.tokenManager?.parsed.issuer.toString(),
          recipient_id: wallet.publicKey?.toString(),
          duration_seconds:
            tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber(),
          expiration_timestamp:
            tokenData.timeInvalidator?.parsed.expiration?.toNumber(),
          max_expiration:
            tokenData.timeInvalidator?.parsed.maxExpiration?.toNumber(),
          extension_seconds: extensionSeconds,
          rental_price: getPriceFromTokenData(
            tokenData as TokenData,
            paymentMints.data
          ),
          rental_extension_price: getExtensionPrice(
            tokenData as TokenData,
            extensionSeconds,
            paymentMints.data
          ),
          rental_total_price:
            getPriceFromTokenData(tokenData as TokenData, paymentMints.data) +
            getExtensionPrice(
              tokenData as TokenData,
              extensionSeconds,
              paymentMints.data
            ),
          payment_mint: PAYMENT_MINTS.filter(
            (mint) =>
              mint.mint ===
              tokenData.claimApprover?.parsed.paymentMint.toString()
          )[0]?.symbol,
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
        console.log('[error][useHandleRateRental]', e)
        return e
      },
      onSuccess: () => {
        queryClient.resetQueries(TOKEN_DATA_KEY)
      },
    }
  )
}
