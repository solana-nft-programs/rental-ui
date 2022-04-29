import { invalidate, unissueToken } from '@cardinal/token-manager'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { BN } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import type { PublicKey } from '@solana/web3.js'
import { TokensOuterStyle } from 'common/CustomStyles'
import { NFT } from 'common/NFT'
import { NFTPlaceholder } from 'common/NFTPlaceholder'
import { notify } from 'common/Notification'
import { StyledTag, Tag } from 'common/Tags'
import { executeTransaction } from 'common/Transactions'
import { shortPubKey } from 'common/utils'
import { asWallet } from 'common/Wallets'
import { useTokenManagersByIssuer } from 'hooks/useTokenManagersByIssuer'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUserTokenData } from 'providers/TokenDataProvider'
import { AsyncButton } from 'rental-components/common/Button'

const handleCopy = (shareUrl: string) => {
  navigator.clipboard.writeText(shareUrl)
  notify({ message: 'Share link copied' })
}

export const Manage = () => {
  const { config } = useProjectConfig()
  const { connection } = useEnvironmentCtx()
  const wallet = useWallet()
  const { refreshTokenAccounts } = useUserTokenData()
  const tokenManagerByIssuer = useTokenManagersByIssuer()

  return (
    <div className="mt-10">
      <TokensOuterStyle>
        {!tokenManagerByIssuer.loaded ? (
          <>
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
          </>
        ) : tokenManagerByIssuer.data &&
          tokenManagerByIssuer.data.length > 0 ? (
          tokenManagerByIssuer.data.map((tokenData) => (
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
                  fullyRounded={true}
                />
                {
                  {
                    [TokenManagerState.Initialized]: <>Initiliazed</>,
                    [TokenManagerState.Issued]: (
                      <StyledTag>
                        <Tag
                          state={TokenManagerState.Issued}
                          onClick={() =>
                            handleCopy(
                              getLink(
                                `/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
                              )
                            )
                          }
                        >
                          Issued by{' '}
                          {shortPubKey(tokenData.tokenManager?.parsed.issuer)}{' '}
                        </Tag>
                        {tokenData.tokenManager?.parsed.issuer.toBase58() ===
                          wallet.publicKey?.toBase58() && (
                          <AsyncButton
                            bgColor={config.colors.secondary}
                            variant="primary"
                            disabled={!wallet.connected}
                            handleClick={async () => {
                              try {
                                if (tokenData?.tokenManager) {
                                  await executeTransaction(
                                    connection,
                                    asWallet(wallet),
                                    await unissueToken(
                                      connection,
                                      asWallet(wallet),
                                      tokenData?.tokenManager?.parsed.mint
                                    ),
                                    {
                                      callback: refreshTokenAccounts,
                                      notificationConfig: {},
                                      silent: true,
                                    }
                                  )
                                }
                              } catch (e) {
                                notify({
                                  message: `Unissue failed: ${e}`,
                                  type: 'error',
                                })
                                console.log(e)
                              }
                            }}
                          >
                            Unissue
                          </AsyncButton>
                        )}
                      </StyledTag>
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
                          <AsyncButton
                            variant="primary"
                            disabled={!wallet.connected}
                            handleClick={async () => {
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
                                    callback: refreshTokenAccounts,
                                    silent: true,
                                    notificationConfig: {},
                                  }
                                )
                            }}
                          >
                            <>Revoke</>
                          </AsyncButton>
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
        ) : (
          <div className="white flex w-full flex-col items-center justify-center gap-1">
            <div className="text-gray-500">No outstanding rentals found...</div>
          </div>
        )}
      </TokensOuterStyle>
    </div>
  )
}
