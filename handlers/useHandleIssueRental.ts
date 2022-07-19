import { tryPublicKey } from '@cardinal/common'
import type { IssueParameters } from '@cardinal/token-manager'
import { issueToken } from '@cardinal/token-manager'
import { findPaymentManagerAddress } from '@cardinal/token-manager/dist/cjs/programs/paymentManager/pda'
import type { InvalidationType } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { TokenManagerKind } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { executeAllTransactions } from 'api/utils'
import { asWallet } from 'common/Wallets'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useMutation } from 'react-query'
import type { RentalCardConfig } from 'rental-components/components/RentalCard'

export interface HandleIssueRentalParams {
  tokenDatas: TokenData[]
  rentalCardConfig: RentalCardConfig
  //
  price?: number
  paymentMint?: string
  durationSeconds?: number
  maxExpiration?: number
  //
  extensionPaymentMint?: string
  extensionPaymentAmount?: number
  extensionDurationSeconds?: number
  //
  totalUsages?: number
  invalidationType?: InvalidationType
  visibility?: 'private' | 'public'
  customInvalidator?: string
  disablePartialExtension?: boolean
  claimRentalReceipt?: boolean
}

export const useHandleIssueRental = () => {
  const wallet = useWallet()
  const { connection } = useEnvironmentCtx()
  return useMutation(
    async ({
      tokenDatas,
      rentalCardConfig,
      price,
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
    }: HandleIssueRentalParams): Promise<{
      tokenManagerIds: PublicKey[]
      otpKeypairs: (Keypair | undefined)[]
      totalSuccessfulTransactions: number
    }> => {
      // console.log(
      //   extensionDurationSeconds,
      //   extensionPaymentAmount,
      //   extensionPaymentMint
      // )
      // if (
      //   (extensionPaymentAmount !== undefined ||
      //     extensionDurationSeconds !== undefined) &&
      //   (extensionPaymentAmount === undefined ||
      //     extensionDurationSeconds === undefined ||
      //     extensionPaymentMint === undefined)
      // ) {
      //   throw 'Please fill out all extension time and price fields'
      // }
      if (!wallet.publicKey) {
        throw 'Wallet not connected'
      }
      if (rentalCardConfig.invalidationOptions?.maxDurationAllowed) {
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
          maxExpiration - Date.now() >
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.value
        ) {
          throw (
            'Duration of rental exceeds max allowed. Max duration allowed is ' +
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.displayText
          )
        }
      }

      const transactions: Transaction[] = []
      const receiptMintKeypairs: Keypair[] = []
      const tokenManagerIds: PublicKey[] = []
      const otpKeypairs: (Keypair | undefined)[] = []
      for (let i = 0; i < tokenDatas.length; i = i + 1) {
        const { tokenAccount, editionData } = tokenDatas[i]!
        if (!tokenAccount) {
          throw 'Token acount not found'
        }
        if (!editionData) {
          throw 'Edition info not found'
        }

        const rentalMint = new PublicKey(
          tokenAccount?.account.data.parsed.info.mint
        )
        const receiptMintKeypair = Keypair.generate()
        receiptMintKeypairs.push(receiptMintKeypair)
        const issueParams: IssueParameters = {
          claimPayment:
            price && paymentMint
              ? {
                  paymentAmount: price,
                  paymentMint: new PublicKey(paymentMint),
                  paymentManager: rentalCardConfig.paymentManager
                    ? tryPublicKey(rentalCardConfig.paymentManager) ||
                      new PublicKey(
                        (
                          await findPaymentManagerAddress(
                            rentalCardConfig.paymentManager
                          )
                        )[0]
                      )
                    : undefined,
                }
              : undefined,
          timeInvalidation:
            maxExpiration || durationSeconds !== undefined
              ? {
                  durationSeconds,
                  maxExpiration,
                  extension:
                    extensionPaymentAmount !== undefined &&
                    extensionDurationSeconds !== undefined &&
                    extensionPaymentMint
                      ? {
                          extensionPaymentAmount,
                          extensionDurationSeconds,
                          extensionPaymentMint:
                            tryPublicKey(extensionPaymentMint)!,
                          disablePartialExtension,
                        }
                      : undefined,
                  paymentManager: rentalCardConfig.paymentManager
                    ? tryPublicKey(rentalCardConfig.paymentManager) ||
                      new PublicKey(
                        (
                          await findPaymentManagerAddress(
                            rentalCardConfig.paymentManager
                          )
                        )[0]
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
                      (
                        await findPaymentManagerAddress(
                          rentalCardConfig.paymentManager
                        )
                      )[0]
                    )
                  : undefined,
              }
            : undefined,
          mint: rentalMint,
          issuerTokenAccountId: tokenAccount?.pubkey,
          kind: editionData
            ? TokenManagerKind.Edition
            : TokenManagerKind.Managed,
          invalidationType,
          visibility,
          customInvalidators: customInvalidator
            ? [new PublicKey(customInvalidator)]
            : undefined,
          receiptOptions: claimRentalReceipt
            ? { receiptMintKeypair }
            : undefined,
        }

        console.log(issueParams)
        const [issueTransaction, tokenManagerId, otpKeypair] = await issueToken(
          connection,
          asWallet(wallet),
          issueParams
        )

        tokenManagerIds.push(tokenManagerId)
        otpKeypairs.push(otpKeypair)

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
      let totalSuccessfulTransactions = 0
      await executeAllTransactions(connection, asWallet(wallet), transactions, {
        callback: async (successfulTxs: number) => {
          totalSuccessfulTransactions = successfulTxs
        },
        signers: claimRentalReceipt ? [receiptMintKeypairs] : [],
        confirmOptions: {
          maxRetries: 3,
        },
        notificationConfig: {
          successSummary: true,
          message: 'Successfully rented out NFTs',
          description: 'These NFTs are now available to rent in the browse tab',
        },
      })
      return { tokenManagerIds, otpKeypairs, totalSuccessfulTransactions }
    }
  )
}
