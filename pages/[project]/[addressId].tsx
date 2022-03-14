import React from 'react'
import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { StyledContainer } from 'common/StyledContainer'
import { useError } from 'providers/ErrorProvider'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useWallet } from '@solana/wallet-adapter-react'
import { Header } from 'common/Header'
import { useUserTokenData } from 'providers/TokenDataProvider'
import { useRouter } from 'next/router'
import Colors from 'common/colors'
import { NFT } from 'common/NFT'
import { firstParam, camelCase } from 'common/utils'
import { Button } from 'rental-components/common/Button'
import { asWallet } from 'common/Wallets'
import { Airdrop } from 'common/Airdrop'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { Manage } from 'components/Manage'
import { Browse } from 'components/Browse'
import { useRentalExtensionModal } from 'rental-components/RentalExtensionModalProvider'
import { useProjectConfigData } from 'providers/ProjectConfigProvider'
import Head from 'next/head'
import { Transaction } from '@solana/web3.js'
import { withFindOrInitAssociatedTokenAccount } from '@cardinal/token-manager'
import { TokenData } from 'api/api'
import { tokenManager } from '@cardinal/token-manager/dist/cjs/programs'
import { withRemainingAccountsForReturn } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { executeTransaction } from 'common/Transactions'
import { tokenManagerAddressFromMint } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/pda'

export const TokensOuter = styled.div`
  display: flex;
  flex-wrap: wrap;
  max-width: 880px;
  margin: 10px auto;
  gap: 20px;

  @media (max-width: 1224px) {
    justify-content: center;
  }
`

export const TokenMetadata = styled.div`
  text-align: center;
  position: relative;
  display: inline-block;
  border-radius: 10px;
  width: 280px;
  background-color: ${Colors.tokenBackground};
  padding: 15px 0px;
  z-index: 0;

  #ellipsis {
    z-index: 1;
    top: 6px;
    right: 10px;
    position: absolute;
    font-size: 20px;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;

    transition: 0.2s all;
    // background: rgba(100, 100, 100);
    background: ${Colors.navBg};
    &:hover {
      // background: rgba(120, 120, 120);
      background: ${Colors.background};
    }
  }

  .qr-code {
    z-index: 5;
    top: 6px;
    right: 10px;
    position: absolute;
    font-size: 15px;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;

    transition: 0.2s all;
    // background: rgba(100, 100, 100);
    background: ${Colors.navBg};
    &:hover {
      // background: rgba(120, 120, 120);
      background: ${Colors.background};
    }
  }

  #header {
    background: rgba(0, 0, 0, 0.4);
    z-index: 1;
    padding: 12px;
    position: absolute;
    top: -50px;
    width: 100%;
    transition: 0.2s all;
  }

  &:hover {
    cursor: pointer;

    #header {
      top: 0;
    }
  }

  #name {
    font-size: 14px;
  }

  #media-outer {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 280px;
    #media {
      object-fit: contain;
      max-width: 250px;
      height: 100%;
      --poster-color: transparent;
    }
  }
`

function Profile() {
  const [error, _setError] = useError()
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  const router = useRouter()
  const { addressId } = router.query
  const [loading, _setLoading] = useState(false)
  const [tab, setTab] = useState<string>('wallet')
  const rentalExtensionModal = useRentalExtensionModal()
  const { projectName, colors, configLoaded } = useProjectConfigData()

  useEffect(() => {
    const anchor = router.asPath.split('#')[1]
    if (anchor != tab) setTab(anchor)
  }, [router.asPath])

  useEffect(() => {
    if (colors) {
      Colors.background = colors.main
    }
  }, [colors])

  const { tokenDatas, setAddress, loaded, refreshing, refreshTokenAccounts } = useUserTokenData()
  useEffect(() => {
    if (addressId) {
      setAddress(firstParam(addressId))
    }
    if (wallet && wallet.connected && wallet.publicKey) {
      setAddress(wallet.publicKey.toBase58())
      router.push(
        `/${projectName}/${wallet.publicKey.toBase58()}${
          new URLSearchParams(window.location.search).get('cluster')
            ? `?cluster=${new URLSearchParams(window.location.search).get(
                'cluster'
              )}`
            : ''
        }`
      )
      setTab('wallet')
    }
  }, [wallet.connected, addressId])

  const revokeRental = async (tokenData: TokenData) => {
    let transaction = new Transaction()
    const tokenManagerId = await tokenManagerAddressFromMint(ctx.connection, tokenData.tokenManager?.parsed.mint);

    const tokenManagerTokenAccountId = await withFindOrInitAssociatedTokenAccount(
      transaction,
      ctx.connection,
      tokenData.tokenManager?.parsed.mint,
      tokenManagerId,
      wallet.publicKey,
      true
    );

    const remainingAccountsForReturn = await withRemainingAccountsForReturn(
      transaction,
      ctx.connection,
      wallet,
      tokenData.tokenManager
    );

    transaction.add(
      await tokenManager.instruction.invalidate(
        ctx.connection,
        wallet,
        tokenData.tokenManager?.parsed.mint,
        tokenManagerId,
        tokenData.tokenManager.parsed.kind,
        tokenData.tokenManager.parsed.state,
        tokenManagerTokenAccountId,
        tokenData.tokenManager?.parsed.recipientTokenAccount,
        remainingAccountsForReturn
      )
    );

    await executeTransaction(ctx.connection, wallet, transaction, {
      silent: false,
      callback: refreshTokenAccounts,
    })
  }

  return (
    <div className="h-screen" style={{ backgroundColor: Colors.background }}>
      <Head>
        <title>{camelCase(projectName)}</title>
      </Head>
      <Header
        loading={loading || refreshing || false}
        tabs={[
          { name: 'Wallet', anchor: 'wallet' },
          { name: 'Manage', anchor: 'manage' },
          { name: 'Browse', anchor: 'browse' },
        ]}
      />
      <StyledContainer style={{ paddingTop: '120px' }}>
        <div style={{ position: 'relative' }}>
          {error}
          {
            {
              wallet: (
                <TokensOuter>
                  {tokenDatas && tokenDatas.length > 0 ? (
                    tokenDatas.map((tokenData) => (
                      <div key={tokenData.metaplexData.data.mint}>
                        <NFT
                          key={tokenData?.tokenAccount?.pubkey.toBase58()}
                          tokenData={tokenData}
                        ></NFT>
                        {tokenData.timeInvalidator?.parsed
                          ?.extensionDurationSeconds ? (
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
                        {tokenData.tokenManager?.parsed
                          ? (
                          <Button
                            variant="primary"
                            className="mx-auto mt-4"
                            onClick={() =>
                              revokeRental(tokenData)
                            }
                          >
                            Return
                          </Button>
                        ) : null}
                      </div>
                    ))
                  ) : loaded && configLoaded ? (
                    <div className="white flex w-full flex-col items-center justify-center gap-1">
                      <div className="text-white">Wallet empty!</div>
                      {ctx.environment.label === 'devnet' && <Airdrop />}
                    </div>
                  ) : (
                    <div className="flex w-full items-center justify-center">
                      <LoadingSpinner />
                    </div>
                  )}
                </TokensOuter>
              ),
              manage: <Manage />,
              browse: <Browse />,
            }[tab || 'wallet']
          }
        </div>
      </StyledContainer>
      <div style={{ marginTop: '100px' }} />
    </div>
  )
}

export default Profile
