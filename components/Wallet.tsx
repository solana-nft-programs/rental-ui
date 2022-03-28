import { withFindOrInitAssociatedTokenAccount } from '@cardinal/token-manager'
import { tokenManager } from '@cardinal/token-manager/dist/cjs/programs'
import { withRemainingAccountsForReturn } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { tokenManagerAddressFromMint } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/pda'
import { useWallet } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { Airdrop } from 'common/Airdrop'
import { NFT, TokensOuter } from 'common/NFT'
import { NFTPlaceholder } from 'common/NFTPlaceholder'
import { notify } from 'common/Notification'
import { executeTransaction } from 'common/Transactions'
import { asWallet } from 'common/Wallets'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useUserTokenData } from 'providers/TokenDataProvider'
import { AsyncButton, Button } from 'rental-components/common/Button'
import { useRentalExtensionModal } from 'rental-components/RentalExtensionModalProvider'

export const Wallet = () => {
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  const { tokenDatas, loaded, refreshTokenAccounts } = useUserTokenData()
  const rentalExtensionModal = useRentalExtensionModal()

  const revokeRental = async (tokenData: TokenData) => {
    if (!tokenData.tokenManager) throw new Error('Invalid token manager')
    if (!wallet.publicKey) throw new Error('Wallet not connected')

    const transaction = new Transaction()
    const tokenManagerId = await tokenManagerAddressFromMint(
      ctx.connection,
      tokenData.tokenManager?.parsed.mint
    )

    const tokenManagerTokenAccountId =
      await withFindOrInitAssociatedTokenAccount(
        transaction,
        ctx.connection,
        tokenData.tokenManager?.parsed.mint,
        tokenManagerId,
        wallet.publicKey,
        true
      )

    const remainingAccountsForReturn = await withRemainingAccountsForReturn(
      transaction,
      ctx.connection,
      asWallet(wallet),
      tokenData.tokenManager
    )

    transaction.add(
      await tokenManager.instruction.invalidate(
        ctx.connection,
        asWallet(wallet),
        tokenData.tokenManager?.parsed.mint,
        tokenManagerId,
        tokenData.tokenManager.parsed.kind,
        tokenData.tokenManager.parsed.state,
        tokenManagerTokenAccountId,
        tokenData.tokenManager?.parsed.recipientTokenAccount,
        remainingAccountsForReturn
      )
    )

    await executeTransaction(ctx.connection, asWallet(wallet), transaction, {
      silent: false,
      callback: refreshTokenAccounts,
    })
  }

  return (
    <TokensOuter>
      {!loaded ? (
        <>
          <NFTPlaceholder />
          <NFTPlaceholder />
          <NFTPlaceholder />
          <NFTPlaceholder />
          <NFTPlaceholder />
          <NFTPlaceholder />
        </>
      ) : tokenDatas && tokenDatas.length > 0 ? (
        tokenDatas.map((tokenData) => (
          <div key={tokenData.tokenAccount?.pubkey.toString()}>
            <NFT
              key={tokenData?.tokenAccount?.pubkey.toBase58()}
              tokenData={tokenData}
            ></NFT>
            {tokenData.timeInvalidator?.parsed?.extensionDurationSeconds ? (
              <Button
                variant="primary"
                className="mx-auto mt-4"
                onClick={() =>
                  rentalExtensionModal.show(
                    asWallet(wallet),
                    ctx.connection,
                    ctx.environment.label,
                    tokenData
                  )
                }
              >
                Increase Duration
              </Button>
            ) : null}
            {tokenData.tokenManager?.parsed ? (
              <AsyncButton
                variant="primary"
                className="mx-auto mt-4"
                handleClick={async () => {
                  try {
                    await revokeRental(tokenData)
                  } catch (e) {
                    notify({
                      message: `Return failed: ${e}`,
                      type: 'error',
                    })
                  }
                }}
              >
                Return
              </AsyncButton>
            ) : null}
          </div>
        ))
      ) : (
        <div className="white flex w-full flex-col items-center justify-center gap-1">
          <div className="text-white">Wallet empty!</div>
          {ctx.environment.label === 'devnet' && <Airdrop />}
        </div>
      )}
    </TokensOuter>
  )
}
