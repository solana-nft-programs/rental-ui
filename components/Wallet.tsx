import { NFT, TokensOuter } from 'common/NFT'
import { asWallet } from 'common/Wallets'
import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { useUserTokenData } from 'providers/TokenDataProvider'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfigData } from 'providers/ProjectConfigProvider'
import { Button } from 'rental-components/common/Button'
import { useRentalExtensionModal } from 'rental-components/RentalExtensionModalProvider'
import { withFindOrInitAssociatedTokenAccount } from '@cardinal/token-manager'
import { withRemainingAccountsForReturn } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { tokenManagerAddressFromMint } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/pda'
import { tokenManager } from '@cardinal/token-manager/dist/cjs/programs'
import { executeTransaction } from 'common/Transactions'
import { notify } from 'common/Notification'
import { Transaction } from '@solana/web3.js'
import { Airdrop } from 'common/Airdrop'
import { TokenData } from 'api/api'

export const Wallet = () => {
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  const { tokenDatas, setAddress, loaded, refreshing, refreshTokenAccounts } =
    useUserTokenData()
  const { configLoaded } = useProjectConfigData()
  const rentalExtensionModal = useRentalExtensionModal()
  const [loadingReturn, setLoadingReturn] = useState(false)

  const revokeRental = async (tokenData: TokenData) => {
    if (!tokenData.tokenManager) throw new Error('Invalid token manager')
    if (!wallet.publicKey) throw new Error('Wallet not connected')

    let transaction = new Transaction()
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
      {!loaded || !configLoaded ? (
        <div className="flex w-full items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : tokenDatas && tokenDatas.length > 0 ? (
        tokenDatas.map((tokenData) => (
          <div key={tokenData.tokenAccount?.pubkey.toString()}>
            <NFT              
              key={tokenData?.tokenAccount?.pubkey.toBase58()}
              tokenData={tokenData}
            ></NFT>
            <div className="flex justify-center">
              {tokenData.timeInvalidator?.parsed?.extensionDurationSeconds ? (
                <Button
                  variant="primary"
                  className="mx-auto mt-4 inline-block"
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
                <Button
                  variant="primary"
                  className="mx-auto mt-4 "
                  onClick={async () => {
                    try {
                      setLoadingReturn(true)
                      if (tokenData) {
                        await revokeRental(tokenData)
                      }
                    } catch (e) {
                      notify({
                        message: `Return failed: ${e}`,
                        type: 'error',
                      })
                    } finally {
                      setLoadingReturn(false)
                    }
                  }}
                >
                  {loadingReturn ? <LoadingSpinner height="25px" /> : 'Return'}
                </Button>
              ) : null}
            </div>
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
