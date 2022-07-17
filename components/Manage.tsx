import { DisplayAddress } from '@cardinal/namespaces-components'
import { invalidate } from '@cardinal/token-manager'
import { shouldTimeInvalidate } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/utils'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { css } from '@emotion/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Card } from 'common/Card'
import { HeaderSlim } from 'common/HeaderSlim'
import { HeroSmall } from 'common/HeroSmall'
import { NFT } from 'common/NFT'
import { stateColor } from 'common/NFTOverlay'
import { executeTransaction } from 'common/Transactions'
import { asWallet } from 'common/Wallets'
import { useManagedTokens } from 'hooks/useManagedTokens'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'
import { FaLink } from 'react-icons/fa'
import { AsyncButton } from 'rental-components/common/Button'

import { getDurationText, handleCopy } from './Browse'

export const Manage = () => {
  const { config } = useProjectConfig()
  const { connection, secondaryConnection } = useEnvironmentCtx()
  const wallet = useWallet()
  const tokenManagerByIssuer = useManagedTokens()
  const { UTCNow } = useUTCNow()

  return (
    <>
      <HeaderSlim
        loading={
          tokenManagerByIssuer.isFetched && tokenManagerByIssuer.isFetching
        }
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
      <HeroSmall />
      <div className="mx-auto mt-12 max-w-[1634px]">
        {!tokenManagerByIssuer.isFetched ? (
          <div className="flex flex-wrap justify-center gap-4 xl:justify-start">
            <Card placeholder header={<></>} subHeader={<></>} />
            <Card placeholder header={<></>} subHeader={<></>} />
            <Card placeholder header={<></>} subHeader={<></>} />
            <Card placeholder header={<></>} subHeader={<></>} />
            <Card placeholder header={<></>} subHeader={<></>} />
            <Card placeholder header={<></>} subHeader={<></>} />
          </div>
        ) : tokenManagerByIssuer.data &&
          tokenManagerByIssuer.data.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-4 xl:justify-start">
            {tokenManagerByIssuer.data.map((tokenData) => (
              <Card
                key={tokenData.tokenManager?.pubkey.toString()}
                hero={<NFT tokenData={tokenData} />}
                header={
                  <div
                    className="flex w-full cursor-pointer flex-row text-sm font-bold text-white"
                    onClick={() =>
                      handleCopy(
                        getLink(
                          `/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
                        )
                      )
                    }
                  >
                    <p className="flex w-fit overflow-hidden text-ellipsis whitespace-nowrap text-left">
                      {tokenData.metadata?.data?.name}
                    </p>
                    <div className="ml-[6px] mt-[2px] flex w-fit">
                      <FaLink />
                    </div>
                  </div>
                }
                content={
                  {
                    [TokenManagerState.Initialized]: <>Initiliazed</>,
                    [TokenManagerState.Issued]: (
                      <div className="flex w-full flex-row justify-between text-sm">
                        {tokenData.tokenManager?.parsed.claimApprover &&
                        !tokenData.claimApprover ? (
                          <div className="my-auto rounded-lg bg-gray-800 px-5 py-2 text-white">
                            Private
                          </div>
                        ) : (
                          <div
                            className="flex flex-col"
                            css={css`
                              color: ${stateColor(
                                TokenManagerState.Issued,
                                true
                              )};
                            `}
                          >
                            <div>{getDurationText(tokenData, UTCNow)}</div>
                            <DisplayAddress
                              connection={secondaryConnection}
                              address={
                                tokenData.tokenManager?.parsed.issuer ||
                                undefined
                              }
                              height="18px"
                              width="100px"
                              dark={true}
                            />
                          </div>
                        )}
                      </div>
                    ),
                    [TokenManagerState.Claimed]: (
                      <div className="flex flex-row justify-between text-sm">
                        {tokenData.recipientTokenAccount?.owner && (
                          <div
                            className="flex flex-col"
                            css={css`
                              color: ${stateColor(
                                TokenManagerState.Claimed,
                                true
                              )};
                            `}
                          >
                            <div className="flex">
                              <span className="inline-block">
                                Claimed by&nbsp;
                              </span>
                              <DisplayAddress
                                style={{
                                  color: '#52c41a !important',
                                  display: 'inline',
                                }}
                                connection={secondaryConnection}
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
                                connection={secondaryConnection}
                                address={tokenData.tokenManager?.parsed.issuer}
                                height="18px"
                                width="100px"
                                dark={true}
                              />
                            </div>
                          </div>
                        )}
                        {((wallet.publicKey &&
                          tokenData?.tokenManager?.parsed.invalidators &&
                          tokenData?.tokenManager?.parsed.invalidators
                            .map((i: PublicKey) => i.toString())
                            .includes(wallet.publicKey?.toString())) ||
                          (tokenData.timeInvalidator &&
                            tokenData.tokenManager &&
                            shouldTimeInvalidate(
                              tokenData.tokenManager,
                              tokenData.timeInvalidator,
                              UTCNow
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
                                    callback: tokenManagerByIssuer.refetch,
                                    silent: true,
                                  }
                                )
                            }}
                          >
                            Revoke
                          </AsyncButton>
                        )}
                      </div>
                    ),
                    [TokenManagerState.Invalidated]: (
                      <div
                        css={css`
                          color: ${stateColor(TokenManagerState.Claimed, true)};
                        `}
                      >
                        Invalidated
                      </div>
                    ),
                  }[tokenData?.tokenManager?.parsed.state as TokenManagerState]
                }
              />
            ))}
          </div>
        ) : (
          <div className="white flex w-full flex-col items-center justify-center gap-1">
            <div className="text-gray-500">
              No outstanding {config.displayName} rentals found...
            </div>
          </div>
        )}
      </div>
    </>
  )
}
