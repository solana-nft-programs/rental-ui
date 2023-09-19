import { BN, utils } from '@coral-xyz/anchor'
import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import { tryPublicKey } from '@solana-nft-programs/common'
import { findPaymentManagerAddress } from '@solana-nft-programs/payment-manager/dist/cjs/pda'
import type { IssueParameters } from '@solana-nft-programs/token-manager'
import { issueToken } from '@solana-nft-programs/token-manager'
import type { InvalidationType } from '@solana-nft-programs/token-manager/dist/cjs/programs/tokenManager'
import { TokenManagerKind } from '@solana-nft-programs/token-manager/dist/cjs/programs/tokenManager'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DURATION_DATA } from 'common/DurationInput'
import {
  getPriceFromTokenData,
  getTokenRentalRate,
} from 'common/tokenDataUtils'
import { executeAllTransactions } from 'common/Transactions'
import { fmtMintAmount } from 'common/units'
import { asWallet } from 'common/Wallets'
import type { TokenData } from 'data/data'
import { TOKEN_DATA_KEY } from 'hooks/useBrowseAvailableTokenDatas'
import { PAYMENT_MINTS, usePaymentMints } from 'hooks/usePaymentMints'
import { logConfigTokenDataEvent } from 'monitoring/amplitude'
import { tracer, withTrace } from 'monitoring/trace'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import type {
  InvalidatorOption,
  RentalCardConfig,
} from 'rental-components/components/RentalIssueCard'

export type IssueTxResult = {
  tokenManagerId: PublicKey
  otpKeypair: Keypair | undefined
  tokenData: TokenData
  claimLink: string
  error?: string
  txid?: string
}

export interface HandleIssueRentalParams {
  tokenDatas: TokenData[]
  rentalCardConfig: RentalCardConfig
  //
  paymentAmount?: BN
  paymentMint?: string
  durationSeconds?: number
  maxExpiration?: number
  //
  extensionPaymentMint?: string
  extensionPaymentAmount?: BN
  extensionDurationSeconds?: number
  //
  totalUsages?: number
  invalidationType?: InvalidationType
  visibility?: 'private' | 'public'
  customInvalidator?: string
  disablePartialExtension?: boolean
  claimRentalReceipt?: boolean
  //
  rentalType: InvalidatorOption
}

export const useHandleIssueRental = () => {
  const wallet = useWallet()
  const { config } = useProjectConfig()
  const { connection } = useEnvironmentCtx()
  const queryClient = useQueryClient()
  const paymentMints = usePaymentMints()

  return useMutation(
    async ({
      tokenDatas,
      rentalCardConfig,
      paymentAmount,
      paymentMint,
      durationSeconds,
      maxExpiration,
      extensionPaymentMint,
      extensionPaymentAmount,
      extensionDurationSeconds,
      totalUsages,
      invalidationType,
      visibility,
      customInvalidator,
      disablePartialExtension,
      claimRentalReceipt,
      rentalType,
    }: HandleIssueRentalParams): Promise<IssueTxResult[]> => {
      if (!wallet.publicKey) {
        throw 'Wallet not connected'
      }
      if (maxExpiration && maxExpiration < Date.now() / 1000) {
        throw 'Rental expiration has already passed. Please select a value after the current date.'
      }
      if (visibility === 'private' && tokenDatas.length > 1) {
        throw 'Private rentals can only be made one at a time.'
      }

      if (rentalCardConfig.invalidationOptions?.maxDurationAllowed) {
        if (
          durationSeconds &&
          durationSeconds >
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.value
        ) {
          throw (
            'Duration of rental exceeds max allowed. Max duration allowed is ' +
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.displayText
          )
        }
        if (
          extensionDurationSeconds &&
          extensionDurationSeconds >
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.value
        ) {
          throw (
            'Duration of rental exceeds max allowed. Max duration allowed is ' +
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.displayText
          )
        }
        if (
          maxExpiration &&
          maxExpiration - Date.now() / 1000 >
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.value
        ) {
          throw (
            'Duration of rental exceeds max allowed. Max duration allowed is ' +
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.displayText
          )
        }
      }

      if (
        !customInvalidator &&
        (!durationSeconds || durationSeconds === 0) &&
        (!maxExpiration || maxExpiration === 0)
      ) {
        throw 'Max expiration required'
      }

      const trace = tracer({ name: 'useHandleIssueRental' })
      const transactions: Transaction[] = []
      const receiptMintKeypairs: Keypair[] = []
      const txData = []
      for (let i = 0; i < tokenDatas.length; i = i + 1) {
        const { tokenAccount, editionData, metaplexData } = tokenDatas[i]!
        if (!tokenAccount) {
          throw 'Token acount not found'
        }
        if (!editionData) {
          throw 'Edition info not found'
        }

        const rentalMint = new PublicKey(tokenAccount?.parsed.mint)
        const receiptMintKeypair = Keypair.generate()
        receiptMintKeypairs.push(receiptMintKeypair)
        const issueParams: IssueParameters = {
          claimPayment:
            paymentAmount && paymentAmount.gt(new BN(0)) && paymentMint
              ? {
                  paymentAmount: paymentAmount.toNumber(),
                  paymentMint: new PublicKey(paymentMint),
                  paymentManager: rentalCardConfig.paymentManager
                    ? tryPublicKey(rentalCardConfig.paymentManager) ||
                      new PublicKey(
                        findPaymentManagerAddress(
                          rentalCardConfig.paymentManager
                        )
                      )
                    : undefined,
                }
              : undefined,
          timeInvalidation:
            !!maxExpiration || !!durationSeconds
              ? {
                  durationSeconds,
                  maxExpiration,
                  extension:
                    extensionPaymentAmount !== undefined &&
                    extensionDurationSeconds !== undefined &&
                    extensionPaymentMint
                      ? {
                          extensionPaymentAmount:
                            extensionPaymentAmount.toNumber(),
                          extensionDurationSeconds,
                          extensionPaymentMint:
                            tryPublicKey(extensionPaymentMint)!,
                          disablePartialExtension,
                        }
                      : undefined,
                  paymentManager: rentalCardConfig.paymentManager
                    ? tryPublicKey(rentalCardConfig.paymentManager) ||
                      new PublicKey(
                        findPaymentManagerAddress(
                          rentalCardConfig.paymentManager
                        )
                      )
                    : undefined,
                }
              : undefined,
          useInvalidation: totalUsages
            ? {
                totalUsages: totalUsages,
                paymentManager: rentalCardConfig.paymentManager
                  ? tryPublicKey(rentalCardConfig.paymentManager) ||
                    new PublicKey(
                      findPaymentManagerAddress(rentalCardConfig.paymentManager)
                    )
                  : undefined,
              }
            : undefined,
          mint: rentalMint,
          issuerTokenAccountId: tokenAccount?.pubkey,
          kind:
            metaplexData?.parsed.tokenStandard ===
            TokenStandard.ProgrammableNonFungible
              ? TokenManagerKind.Programmable
              : editionData
              ? TokenManagerKind.Edition
              : TokenManagerKind.Managed,
          rulesetId:
            metaplexData?.parsed.programmableConfig?.ruleSet ?? undefined,
          invalidationType,
          visibility,
          customInvalidators: customInvalidator
            ? [new PublicKey(customInvalidator)]
            : undefined,
          receiptOptions: claimRentalReceipt
            ? { receiptMintKeypair }
            : undefined,
        }

        const [issueTransaction, tokenManagerId, otpKeypair] = await withTrace(
          () => issueToken(connection, asWallet(wallet), issueParams),
          trace,
          { op: 'issueToken' }
        )

        txData.push({
          tokenManagerId,
          tokenData: tokenDatas[i]!,
          otpKeypair,
        })

        const transaction = new Transaction()
        transaction.instructions = otpKeypair
          ? [
              ...issueTransaction.instructions,
              SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: otpKeypair.publicKey,
                lamports: 0.001 * LAMPORTS_PER_SOL,
              }),
            ]
          : issueTransaction.instructions
        transactions.push(transaction)
      }
      const txResults = await withTrace(
        () =>
          executeAllTransactions(connection, asWallet(wallet), transactions, {
            signers: claimRentalReceipt ? [receiptMintKeypairs] : [],
            confirmOptions: {
              maxRetries: 3,
            },
            notificationConfig: {
              successSummary: true,
              message: 'Successfully rented out NFTs',
              description:
                'These NFTs are now available to rent in the browse tab',
            },
          }),
        trace,
        { op: 'executeAllTransaction' }
      )
      for (let i = 0; i < txData.length; i++) {
        const txResult = txResults[i]
        const tokenData = txData[i]?.tokenData
        if (!txResult?.error && tokenData) {
          logConfigTokenDataEvent('nft rental: issue', config, tokenData, {
            rental_type: rentalType,
            rental_price: getPriceFromTokenData(tokenData),
            rental_rate: getTokenRentalRate(
              config,
              paymentMints.data ?? {},
              tokenData
            )?.displayText,
            rental_rate_duration:
              DURATION_DATA[config.marketplaceRate ?? 'days'],
            payment_mint: PAYMENT_MINTS.filter(
              (mint) => mint.mint === paymentMint
            )[0]?.symbol,
            duration_seconds: durationSeconds,
            max_expiration: maxExpiration,
            extension_payment_mint: PAYMENT_MINTS.filter(
              (mint) => mint.mint === extensionPaymentMint
            )[0]?.symbol,
            extension_payment_amount: fmtMintAmount(
              paymentMints.data?.[extensionPaymentMint ?? ''],
              extensionPaymentAmount ?? new BN(0)
            ),
            extension_duration_seconds: extensionDurationSeconds,
            total_usages: totalUsages,
            invalidation_type: invalidationType,
            visibility: visibility,
            custom_invalidator: customInvalidator,
            disable_partial_extension: disablePartialExtension,
            claim_rental_receipt: claimRentalReceipt,
            issuer_id: wallet.publicKey?.toString(),
          })
        }
      }

      trace.finish()
      return txData.map((txData, i) => ({
        ...txData,
        error: txResults[i]?.error ?? undefined,
        txid: txResults[i]?.txid ?? undefined,
        otpKeypair: txData.otpKeypair,
        claimLink: getLink(
          `/${
            config.name
          }/${txData.tokenManagerId.toString()}${`?mintIdString=${txData.tokenData.mint?.pubkey.toString()}`}${
            txData.otpKeypair
              ? `&otp=${utils.bytes.bs58.encode(txData.otpKeypair.secretKey)}`
              : ''
          }`
        ),
      }))
    },
    {
      onSuccess: () => {
        queryClient.resetQueries([TOKEN_DATA_KEY])
      },
    }
  )
}
