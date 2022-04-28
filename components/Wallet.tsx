import { withInvalidate } from '@cardinal/token-manager'
import { InvalidationType } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
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
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUserTokenData } from 'providers/TokenDataProvider'
import { AsyncButton, Button } from 'rental-components/common/Button'
import { useRentalExtensionModal } from 'rental-components/RentalExtensionModalProvider'

export const Wallet = () => {
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  const { config } = useProjectConfig()
  const { tokenDatas, loaded, refreshTokenAccounts } = useUserTokenData()
  const rentalExtensionModal = useRentalExtensionModal()

  const revokeRental = async (tokenData: TokenData) => {
    if (!tokenData.tokenManager) throw new Error('Invalid token manager')
    if (!wallet.publicKey) throw new Error('Wallet not connected')

    const transaction = new Transaction()

    await withInvalidate(
      transaction,
      ctx.connection,
      asWallet(wallet),
      tokenData.tokenManager?.parsed.mint
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
          <div
            key={tokenData.tokenAccount?.pubkey.toString()}
            className="flex flex-col pt-10"
          >
            <NFT
              key={tokenData?.tokenAccount?.pubkey.toBase58()}
              tokenData={tokenData}
              fullyRounded={false}
            ></NFT>
            <div className="flex w-[280px] flex-row justify-between rounded-bl-md rounded-br-md bg-white/[.10] p-3">
              <p className="mt-2 mr-4 overflow-hidden text-ellipsis whitespace-nowrap text-white">
                {tokenData.metadata.data.name}
              </p>
              <div className="my-auto flex-col justify-items-end">
                {tokenData.timeInvalidator?.parsed?.extensionDurationSeconds &&
                  tokenData.tokenManager && (
                    <Button
                      variant="primary"
                      className=" float-right mb-3"
                      onClick={() =>
                        rentalExtensionModal.show(
                          asWallet(wallet),
                          ctx.connection,
                          ctx.environment.label,
                          tokenData
                        )
                      }
                    >
                      Add Duration
                    </Button>
                  )}
                {tokenData.tokenManager?.parsed &&
                  (tokenData.tokenManager.parsed.invalidationType ===
                    InvalidationType.Reissue ||
                    tokenData.tokenManager.parsed.invalidationType ===
                      InvalidationType.Return) && (
                    <AsyncButton
                      variant="primary"
                      className=" float-right my-auto"
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
                  )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="white mt-10 flex w-full flex-col items-center justify-center gap-1">
          <div className="text-gray-500">
            No {config.name} NFTs found in wallet!
          </div>
          {ctx.environment.label === 'devnet' && <Airdrop />}
        </div>
      )}
    </TokensOuter>
  )
}
