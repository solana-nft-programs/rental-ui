import React, { useEffect, useState } from 'react'
import { NFT, TokensOuter } from 'common/NFT'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { Button } from 'rental-components/common/Button'
import { notify } from 'common/Notification'
import { shortPubKey } from 'common/utils'
import { PublicKey, Transaction } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { FaLink } from 'react-icons/fa'
import { invalidate, unissueToken } from '@cardinal/token-manager'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { asWallet } from 'common/Wallets'
import { executeTransaction } from 'common/Transactions'
import { BN } from '@project-serum/anchor'
import { useIssuedTokens } from 'providers/IssuedTokensProvider'
import { findClaimApproverAddress } from '@cardinal/token-manager/dist/cjs/programs/claimApprover/pda'
import { TokenData } from 'api/api'
import { WRAPPED_SOL_MINT } from 'providers/PaymentMintsProvider'
import * as splToken from '@solana/spl-token'
import { withWrapSol } from 'api/wrappedSol'
import { withClaimToken } from '@cardinal/token-manager'
import { StyledTag, Tag } from 'common/Tags'
import { useProjectConfigData } from 'providers/ProjectConfigProvider'

const handleCopy = (shareUrl: string) => {
  navigator.clipboard.writeText(shareUrl)
  notify({ message: 'Share link copied' })
}

export const Browse = () => {
  const { connection } = useEnvironmentCtx()
  const wallet = useWallet()
  let { issuedTokens, loaded, refreshIssuedTokens } = useIssuedTokens()
  let [filteredIssuedTokens, setFilteredIssuedTokens] =
    useState<TokenData[]>(issuedTokens)
  const [userPaymentTokenAccount, _setUserPaymentTokenAccount] =
    useState<splToken.AccountInfo | null>(null)
  const { colors } = useProjectConfigData()

  useEffect(() => {
    async function filterIssuedTokens() {
      const tokens = []
      for (let token of issuedTokens) {
        if (!token.claimApprover?.pubkey) {
          tokens.push(token)
        } else {
          let [tokenClaimApprover] = await findClaimApproverAddress(
            token.tokenManager?.pubkey!
          )
          if (
            tokenClaimApprover.toString() ===
            token.claimApprover?.pubkey.toString()
          ) {
            tokens.push(token)
          }
        }
      }
      setFilteredIssuedTokens(tokens)
    }

    filterIssuedTokens()
  }, [issuedTokens])

  const handleClaim = async (tokenData: TokenData) => {
    try {
      // wrap sol if there is payment required
      const transaction = new Transaction()
      if (
        tokenData?.claimApprover?.parsed.paymentAmount &&
        tokenData?.claimApprover?.parsed.paymentMint.toString() ===
          WRAPPED_SOL_MINT.toString() &&
        tokenData?.claimApprover?.parsed.paymentAmount.gt(new BN(0))
      ) {
        const amountToWrap = tokenData?.claimApprover?.parsed.paymentAmount.sub(
          userPaymentTokenAccount?.amount || new BN(0)
        )
        if (amountToWrap.gt(new BN(0))) {
          await withWrapSol(
            transaction,
            connection,
            asWallet(wallet),
            amountToWrap.toNumber()
          )
        }
      }
      console.log('Claiming token manager', tokenData)
      await withClaimToken(
        transaction,
        connection,
        asWallet(wallet),
        tokenData.tokenManager?.pubkey!
      )
      await executeTransaction(connection, asWallet(wallet), transaction, {
        confirmOptions: { commitment: 'confirmed', maxRetries: 3 },
        signers: [],
        notificationConfig: {},
      })
      refreshIssuedTokens()
    } catch (e: any) {
      console.log(e)
    }
  }

  return (
    <TokensOuter>
      {filteredIssuedTokens && filteredIssuedTokens.length > 0 ? (
        filteredIssuedTokens.map((tokenData) => (
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
                    <div className="flex w-full justify-between">
                      <StyledTag>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            width: '100%',
                          }}
                        >
                          <Tag state={TokenManagerState.Issued} color="warning">
                            <div className="float-left">
                              <p className="float-left inline-block">
                                {new Date(
                                  Number(
                                    tokenData.tokenManager?.parsed.stateChangedAt.toString()
                                  ) * 1000
                                ).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </p>
                              <br />
                              <p className="float-left inline-block">
                                {' '}
                                {shortPubKey(
                                  tokenData.tokenManager?.parsed.issuer
                                )}{' '}
                              </p>
                            </div>
                          </Tag>
                          {tokenData.tokenManager?.parsed.issuer.toBase58() ===
                            wallet.publicKey?.toBase58() && (
                            <p
                              className="float-right w-max text-xs text-gray-400 hover:cursor-pointer hover:text-gray-300"
                              onClick={async () =>
                                tokenData?.tokenManager &&
                                executeTransaction(
                                  connection,
                                  asWallet(wallet),
                                  await unissueToken(
                                    connection,
                                    asWallet(wallet),
                                    tokenData?.tokenManager?.parsed.mint
                                  ),
                                  {
                                    callback: refreshIssuedTokens,
                                    silent: true,
                                  }
                                )
                              }
                            >
                              Unissue
                            </p>
                          )}
                        </div>
                      </StyledTag>
                      <div className="flex w-max">
                        <Button
                          bgColor={colors.secondary}
                          variant="primary"
                          className="mr-1 inline-block flex-none"
                          onClick={() => handleClaim(tokenData)}
                        >
                          Claim{' '}
                          {(tokenData.claimApprover?.parsed?.paymentAmount.toNumber() ??
                            0) / 1000000000}{' '}
                          ◎
                        </Button>
                        <Button
                          variant="tertiary"
                          className="mr-1 inline-block flex-none"
                          onClick={() =>
                            handleCopy(
                              `${
                                process.env.BASE_URL
                              }/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
                            )
                          }
                        >
                          <FaLink />
                        </Button>
                      </div>
                    </div>
                  ),
                  [TokenManagerState.Claimed]: (
                    <StyledTag>
                      <Tag state={TokenManagerState.Claimed}>
                        Claimed by{' '}
                        {shortPubKey(
                          tokenData.recipientTokenAccount?.owner || ''
                        )}{' '}
                        {/* {shortDateString(
                          tokenData.tokenManager?.parsed.claimedAt
                        )} */}
                      </Tag>
                      {((wallet.publicKey &&
                        tokenData?.tokenManager?.parsed.invalidators &&
                        tokenData?.tokenManager?.parsed.invalidators
                          .map((i: PublicKey) => i.toString())
                          .includes(wallet.publicKey?.toString())) ||
                        (tokenData.timeInvalidator &&
                          tokenData.timeInvalidator.parsed.expiration &&
                          tokenData.timeInvalidator.parsed.expiration.lte(
                            new BN(Date.now() / 1000)
                          )) ||
                        (tokenData.useInvalidator &&
                          tokenData.useInvalidator.parsed.maxUsages &&
                          tokenData.useInvalidator.parsed.usages.gte(
                            tokenData.useInvalidator.parsed.maxUsages
                          ))) && (
                        <Button
                          variant="primary"
                          disabled={!wallet.connected}
                          onClick={async () => {
                            tokenData?.tokenManager &&
                              executeTransaction(
                                connection,
                                asWallet(wallet),
                                await invalidate(
                                  connection,
                                  asWallet(wallet),
                                  tokenData?.tokenManager?.parsed.mint
                                ),
                                {
                                  callback: refreshIssuedTokens,
                                  silent: true,
                                }
                              )
                          }}
                        >
                          Revoke
                        </Button>
                      )}
                    </StyledTag>
                  ),
                  [TokenManagerState.Invalidated]: (
                    <Tag state={TokenManagerState.Invalidated}>
                      Invalidated
                      {/* {shortDateString(
                    tokenData.tokenManager?.parsed.claimedAt
                  )} */}
                    </Tag>
                  ),
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
