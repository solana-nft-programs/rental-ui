import { withFindOrInitAssociatedTokenAccount } from '@cardinal/token-manager'
import { tokenManager } from '@cardinal/token-manager/dist/cjs/programs'
import { withRemainingAccountsForReturn } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { tokenManagerAddressFromMint } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/pda'
import { useWallet } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { Airdrop } from 'common/Airdrop'
import { Header } from 'common/Header'
import { NFT, TokensOuter } from 'common/NFT'
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

  const getExpiredTokens = (tokenData: TokenData[]) => {    
    let datas = tokenData.filter(token => token?.metaplexData?.data?.data?.uri.includes('api.cardinal.so') 
    && !token.tokenManager
    && token.tokenAccount?.account.data.parsed.info.state !== 'frozen'    
    && token?.metadata?.data?.name === 'EXPIRED'
    )
    // console.log(datas[0])
    // console.log(datas[1])
    return datas
  }

  const expiredTokens: TokenData[] = getExpiredTokens(tokenDatas)

  return (
    <>
      <Header />
      <TokensOuter style={{ marginTop: '120px' }}>
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
      </TokensOuter>
    </>
  )
}

export default Burn
