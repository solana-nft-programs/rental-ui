import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { css } from '@emotion/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card } from 'common/Card'
import { HeaderSlim } from 'common/HeaderSlim'
import { HeroSmall } from 'common/HeroSmall'
import { NFT, stateColor } from 'common/NFT'
import { NFTHeader } from 'common/NFTHeader'
import { NFTIssuerInfo } from 'common/NFTIssuerInfo'
import { NFTRevokeButton } from 'common/NFTRevokeButton'
import { useManagedTokens } from 'hooks/useManagedTokens'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

export const Manage = () => {
  const { config } = useProjectConfig()
  const wallet = useWallet()
  const tokenManagerByIssuer = useManagedTokens()
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
      <HeroSmall tokenDatas={tokenManagerByIssuer.data} />
      <div className="mx-auto mt-12 max-w-[1634px]">
        {!tokenManagerByIssuer.isFetched ? (
          <div className="flex flex-wrap justify-center gap-4 xl:justify-start">
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
          </div>
        ) : tokenManagerByIssuer.data &&
          tokenManagerByIssuer.data.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-4 xl:justify-start">
            {tokenManagerByIssuer.data.map((tokenData) => (
              <Card
                key={tokenData.tokenManager?.pubkey.toString()}
                hero={<NFT tokenData={tokenData} />}
                header={<NFTHeader tokenData={tokenData} />}
                content={
                  {
                    [TokenManagerState.Initialized]: <>Initiliazed</>,
                    [TokenManagerState.Issued]: (
                      <div className="flex w-full flex-row justify-between text-sm">
                        <NFTIssuerInfo tokenData={tokenData} />
                      </div>
                    ),
                    [TokenManagerState.Claimed]: (
                      <div className="flex flex-row justify-between text-sm">
                        <NFTIssuerInfo tokenData={tokenData} />
                        <NFTRevokeButton
                          tokenData={tokenData}
                          callback={() => tokenManagerByIssuer.refetch()}
                        />
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
