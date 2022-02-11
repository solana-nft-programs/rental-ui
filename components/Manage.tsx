import React, { useEffect, useState } from 'react'
import { NFT, TokensOuter } from 'common/NFT'
import styled from '@emotion/styled'
import { useManagedTokens } from 'providers/ManagedTokensProvider'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { Button } from 'rental-components/common/Button'
import { notify } from 'common/Notification'
import { shortDateString, shortPubKey } from 'common/utils'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { stateColor } from 'common/NFTOverlay'
import { FaLink } from 'react-icons/fa'
import { invalidate, unissue } from '@cardinal/token-manager'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { asWallet } from 'common/Wallets'
import { executeTransaction } from 'common/Transactions'
import { useUserTokenData } from 'providers/TokenDataProvider'
import { NFTPlaceholder } from 'common/NFTPlaceholder'

const StyledTag = styled.span`
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  span {
    border: none;
    background: none;
    display: block;
  }
  button {
    margin: 5px 0px;
  }
`

const Tag = styled.div<{ state: TokenManagerState }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  cursor: pointer;
  color: ${({ state }) => stateColor(state, true)};
`

const handleCopy = (shareUrl: string) => {
  navigator.clipboard.writeText(shareUrl)
  notify({ message: 'Share link copied' })
}

export const Manage = () => {
  const { connection } = useEnvironmentCtx()
  const wallet = useWallet()
  const { refreshTokenAccounts } = useUserTokenData()
  const { managedTokens, loaded } = useManagedTokens()
  return (
    <TokensOuter>
      {managedTokens && managedTokens.length > 0 ? (
        managedTokens.map((tokenData) => (
          <div
            key={tokenData.tokenManager?.pubkey.toString()}
            style={{
              paddingTop: '10px',
              display: 'flex',
              gap: '10px',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <>
              <NFT
                key={tokenData?.tokenManager?.pubkey.toBase58()}
                tokenData={tokenData}
                hideQRCode={true}
              ></NFT>
              {
                {
                  [TokenManagerState.Initialized]: <>Initiliazed</>,
                  [TokenManagerState.Issued]: (
                    <StyledTag>
                      <Tag
                        state={TokenManagerState.Issued}
                        onClick={() =>
                          handleCopy(
                            `${
                              process.env.BASE_URL
                            }/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
                          )
                        }
                        color="warning"
                      >
                        Issued by{' '}
                        {shortPubKey(tokenData.tokenManager?.parsed.issuer)}{' '}
                        {/* {shortDateString(tokenData.tokenManager?.parsed.issuedAt)} */}
                        <FaLink className="ml-1" />
                      </Tag>
                      {tokenData.tokenManager?.parsed.issuer.toBase58() ===
                        wallet.publicKey?.toBase58() && (
                        <Button
                          variant="primary"
                          disabled={!wallet.connected}
                          onClick={async () =>
                            executeTransaction(
                              connection,
                              asWallet(wallet),
                              await unissue(
                                connection,
                                asWallet(wallet),
                                tokenData?.tokenManager?.parsed.mint
                              ),
                              { callback: refreshTokenAccounts, silent: true }
                            )
                          }
                        >
                          Unissue
                        </Button>
                      )}
                    </StyledTag>
                  ),
                  [TokenManagerState.Claimed]: (
                    <StyledTag>
                      <Tag state={TokenManagerState.Claimed}>
                        Claimed by{' '}
                        {shortPubKey(
                          tokenData.tokenAccount?.account?.data?.parsed?.info
                            .owner
                        )}{' '}
                        {/* {shortDateString(
                          tokenData.tokenManager?.parsed.claimedAt
                        )} */}
                      </Tag>
                      {tokenData?.tokenManager?.parsed.invalidators &&
                        tokenData?.tokenManager?.parsed.invalidators
                          .map((i: PublicKey) => i.toString())
                          .includes(wallet.publicKey?.toBase58()) && (
                          <Button
                            variant="primary"
                            disabled={!wallet.connected}
                            onClick={async () => {
                              executeTransaction(
                                connection,
                                asWallet(wallet),
                                await invalidate(
                                  connection,
                                  asWallet(wallet),
                                  tokenData?.tokenManager?.parsed.mint
                                ),
                                { callback: refreshTokenAccounts, silent: true }
                              )
                            }}
                          >
                            Revoke
                          </Button>
                        )}
                    </StyledTag>
                  ),
                  [TokenManagerState.Invalidated]: <>Invalidated</>,
                }[tokenData?.tokenManager?.parsed.state as TokenManagerState]
              }
            </>
          </div>
        ))
      ) : loaded ? (
        <div className="white flex w-full flex-col items-center justify-center gap-1">
          <div className="text-white">No outstanding tokens!</div>
        </div>
      ) : (
        <div className="flex w-full items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
    </TokensOuter>
  )
}
