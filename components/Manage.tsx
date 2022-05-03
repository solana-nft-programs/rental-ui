import { DisplayAddress } from '@cardinal/namespaces-components'
import { invalidate, unissueToken } from '@cardinal/token-manager'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { BN } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Header } from 'common/Header'
import { NFT, NFTPlaceholder, TokensOuter } from 'common/NFT'
import { notify } from 'common/Notification'
import { Tag } from 'common/Tags'
import { executeTransaction } from 'common/Transactions'
import { asWallet } from 'common/Wallets'
import { useTokenManagersByIssuer } from 'hooks/useTokenManagersByIssuer'
import { lighten } from 'polished'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUserTokenData } from 'providers/TokenDataProvider'
import { FaLink } from 'react-icons/fa'
import { AsyncButton } from 'rental-components/common/Button'

import { getDurationText, handleCopy } from './Browse'

export const Manage = () => {
  const { config } = useProjectConfig()
  const { connection } = useEnvironmentCtx()
  const wallet = useWallet()
  const { refreshTokenAccounts } = useUserTokenData()
  const tokenManagerByIssuer = useTokenManagersByIssuer()

  return (
    <>
      <Header
        tabs={[
          {
            name: 'Wallet',
            anchor: wallet.publicKey?.toBase58() || 'wallet',
            disabled: !wallet.connected,
          },
          {
            name: 'Manage',
            anchor: 'manage',
            disabled: !wallet.connected || config.disableListing,
          },
          { name: 'Browse', anchor: 'browse' },
        ]}
      />
      <div className="mt-10">
        <TokensOuter>
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
                className="flex flex-col justify-center align-middle"
              >
                <NFT
                  key={tokenData?.tokenManager?.pubkey.toBase58()}
                  tokenData={tokenData}
                />
                {
                  {
                    [TokenManagerState.Initialized]: <>Initiliazed</>,
                    [TokenManagerState.Issued]: (
                      <div
                        style={{
                          background: lighten(0.07, config.colors.main),
                        }}
                        className={`flex min-h-[82px] w-[280px] flex-col rounded-bl-md rounded-br-md p-3`}
                      >
                        <div
                          className="mb-2 flex w-full flex-row text-xs font-bold text-white"
                          onClick={() =>
                            handleCopy(
                              getLink(
                                `/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
                              )
                            )
                          }
                        >
                          <p className="flex w-fit overflow-hidden text-ellipsis whitespace-nowrap text-left">
                            {tokenData.metadata.data.name}
                          </p>
                          <div className="ml-[6px] mt-[2px] flex w-fit cursor-pointer">
                            <span className="flex w-full text-left">
                              <FaLink />
                            </span>
                          </div>
                        </div>

                        <div className="flex w-full flex-row justify-between text-xs">
                          {tokenData.timeInvalidator?.parsed ? (
                            <Tag state={TokenManagerState.Issued}>
                              <div className="flex flex-col">
                                <div>{getDurationText(tokenData)}</div>
                                <DisplayAddress
                                  style={{
                                    color: '#52c41a !important',
                                    display: 'inline',
                                  }}
                                  connection={connection}
                                  address={
                                    tokenData.tokenManager?.parsed.issuer ||
                                    undefined
                                  }
                                  height="18px"
                                  width="100px"
                                  dark={true}
                                />
                              </div>
                            </Tag>
                          ) : (
                            <div className="my-auto rounded-lg bg-gray-800 px-5 py-2 text-white">
                              Private
                            </div>
                          )}

                          <AsyncButton
                            bgColor={config.colors.secondary}
                            variant="primary"
                            disabled={!wallet.connected}
                            className="my-auto inline-block flex-none text-xs"
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
                        </div>
                      </div>
                    ),
                    [TokenManagerState.Claimed]: (
                      <div
                        style={{
                          background: lighten(0.07, config.colors.main),
                        }}
                        className={`flex min-h-[82px] w-[280px] flex-col rounded-bl-md rounded-br-md p-3`}
                      >
                        <div
                          className="mb-2 flex w-full cursor-pointer flex-row text-xs font-bold text-white"
                          onClick={() =>
                            handleCopy(
                              getLink(
                                `/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
                              )
                            )
                          }
                        >
                          <p className="flex w-fit overflow-hidden text-ellipsis whitespace-nowrap text-left">
                            {tokenData.metadata.data.name}
                          </p>
                          <div className="ml-[6px] mt-[2px] flex w-fit">
                            <span className="flex w-full text-left">
                              <FaLink />
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-row justify-between text-xs">
                          {tokenData.recipientTokenAccount?.owner && (
                            <Tag state={TokenManagerState.Claimed}>
                              <div className="flex flex-col">
                                <div className="flex">
                                  <span className="inline-block">
                                    Claimed by&nbsp;
                                  </span>
                                  <DisplayAddress
                                    style={{
                                      color: '#52c41a !important',
                                      display: 'inline',
                                    }}
                                    connection={connection}
                                    address={
                                      new PublicKey(
                                        tokenData.recipientTokenAccount?.owner
                                      )
                                    }
                                    height="18px"
                                    width="100px"
                                    dark={true}
                                  />
                                </div>
                                <div className="flex">
                                  <span className="inline-block">
                                    Issued by&nbsp;
                                  </span>
                                  <DisplayAddress
                                    style={{
                                      color: '#52c41a !important',
                                      display: 'inline',
                                    }}
                                    connection={connection}
                                    address={
                                      tokenData.tokenManager?.parsed.issuer
                                    }
                                    height="18px"
                                    width="100px"
                                    dark={true}
                                  />
                                </div>
                              </div>
                            </Tag>
                          )}
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
                                      callback: tokenManagerByIssuer.refresh,
                                      silent: true,
                                    }
                                  )
                              }}
                            >
                              Revoke
                            </AsyncButton>
                          )}
                        </div>
                      </div>
                    ),
                    [TokenManagerState.Invalidated]: (
                      <Tag state={TokenManagerState.Invalidated}>
                        Invalidated
                      </Tag>
                    ),
                  }[tokenData?.tokenManager?.parsed.state as TokenManagerState]
                }
              </div>
            ))
          ) : (
            <div className="white flex w-full flex-col items-center justify-center gap-1">
              <div className="text-gray-500">
                No outstanding {config.name} rentals found...
              </div>
            </div>
          )}
        </TokensOuter>
      </div>
    </>
  )
}
