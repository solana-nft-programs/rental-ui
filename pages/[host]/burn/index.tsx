import { withFindOrInitAssociatedTokenAccount } from '@cardinal/token-manager'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { Airdrop } from 'common/Airdrop'
import { TokensOuterStyle } from 'common/CustomStyles'
import { Header } from 'common/Header'
import { NFT } from 'common/NFT'
import { NFTPlaceholder } from 'common/NFTPlaceholder'
import { notify } from 'common/Notification'
import { executeTransaction } from 'common/Transactions'
import { asWallet } from 'common/Wallets'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useUserTokenData } from 'providers/TokenDataProvider'
import { useEffect } from 'react'
import { AsyncButton, Button } from 'rental-components/common/Button'
import { useRentalExtensionModal } from 'rental-components/RentalExtensionModalProvider'

function Burn() {
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  const { tokenDatas, setAddress, loaded, refreshTokenAccounts } =
    useUserTokenData()
  const rentalExtensionModal = useRentalExtensionModal()

  useEffect(() => {
    if (wallet.publicKey) {
      setAddress(wallet.publicKey.toString())
    }
  }, [wallet.publicKey])

  const revokeRental = async (tokenData: TokenData) => {
    const transaction = new Transaction()
    const mintId = tokenData.metaplexData?.data.mint
    if (!mintId || !wallet.publicKey) return
    const walletAta = await withFindOrInitAssociatedTokenAccount(
      transaction,
      ctx.connection,
      new PublicKey(mintId),
      wallet.publicKey,
      wallet.publicKey
    )
    const burnAta = await withFindOrInitAssociatedTokenAccount(
      transaction,
      ctx.connection,
      new PublicKey(mintId),
      new PublicKey('cburnbWPAQZMziATsjPoSjqGFA4apFhfVXyL5Qkwftt'),
      wallet.publicKey
    )

    transaction.add(
      Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        walletAta,
        burnAta,
        wallet.publicKey,
        [],
        1
      )
    )

    transaction.add(
      Token.createCloseAccountInstruction(
        TOKEN_PROGRAM_ID,
        walletAta,
        wallet.publicKey,
        wallet.publicKey,
        []
      )
    )

    await executeTransaction(ctx.connection, asWallet(wallet), transaction, {
      silent: false,
      callback: refreshTokenAccounts,
      notificationConfig: {},
    })
  }

  const getExpiredTokens = (tokenData: TokenData[]) => {
    const datas = tokenData.filter(
      (token) =>
        token?.metaplexData?.data?.data?.uri.includes('api.cardinal.so') &&
        !token.tokenManager &&
        token.tokenAccount?.account.data.parsed.info.state !== 'frozen' &&
        token?.metadata?.data?.name === 'EXPIRED'
    )
    // console.log(datas[0])
    // console.log(datas[1])
    return datas
  }

  const expiredTokens: TokenData[] = getExpiredTokens(tokenDatas)

  return (
    <>
      <Header />
      <TokensOuterStyle style={{ marginTop: '120px' }}>
        {!loaded ? (
          <>
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
          </>
        ) : expiredTokens && expiredTokens.length > 0 ? (
          expiredTokens.map((tokenData) => (
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

              <AsyncButton
                variant="primary"
                className="mx-auto mt-3"
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
                Burn
              </AsyncButton>
            </div>
          ))
        ) : (
          <div className="white flex w-full flex-col items-center justify-center gap-1">
            <div className="text-white">Wallet empty!</div>
            {ctx.environment.label === 'devnet' && <Airdrop />}
          </div>
        )}
      </TokensOuterStyle>
    </>
  )
}

export default Burn
