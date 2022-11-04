import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { css } from '@emotion/react'
import type { TokenData } from 'apis/api'
import { GlyphLargeClose } from 'assets/GlyphLargeClose'
import { ButtonSmall } from 'common/ButtonSmall'
import { Card } from 'common/Card'
import { NFT } from 'common/NFT'
import { NFTClaimButton } from 'common/NFTClaimButton'
import { NFTHeader } from 'common/NFTHeader'
import { NFTIssuerInfo } from 'common/NFTIssuerInfo'
import { NFTViewRental } from 'common/NFTViewRental'
import { elligibleForRent, getMintfromTokenData } from 'common/tokenDataUtils'
import type { BrowseAvailableTokenData } from 'hooks/useBrowseAvailableTokenDatas'
import type { BrowseClaimedTokenData } from 'hooks/useBrowseClaimedTokenDatas'
import { useWalletId } from 'hooks/useWalletId'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useEffect, useState } from 'react'

import { isSelected } from './TokenQueryResults'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  tokenDatas?: (BrowseAvailableTokenData | BrowseClaimedTokenData | TokenData)[]
  isFetched?: boolean
  isFetching?: boolean
  refetch?: () => void
  selectedTokens?: TokenData[]
  displayInvalidationInfo?: boolean
  handleClick?: (tokenData: TokenData) => void
}

export const PAGE_SIZE = 5
export const DEFAULT_PAGE: [number, number] = [2, 0]

export const TokenQueryData: React.FC<Props> = ({
  tokenDatas,
  isFetched,
  refetch,
  selectedTokens,
  handleClick,
  displayInvalidationInfo,
}: Props) => {
  const { config } = useProjectConfig()
  const [pageNum, setPageNum] = useState<[number, number]>(DEFAULT_PAGE)
  const walletId = useWalletId()

  useEffect(() => {
    setPageNum(DEFAULT_PAGE)
  }, [
    tokenDatas?.map((tokenData) => getMintfromTokenData(tokenData)).join(','),
  ])

  useEffect(() => {
    const onScroll = (event: Event) => {
      const { scrollHeight, scrollTop, clientHeight } =
        // @ts-ignore
        event.target?.scrollingElement
      if (scrollHeight - scrollTop <= clientHeight * 1.5) {
        setPageNum(([n, prevScrollHeight]) => {
          return prevScrollHeight !== scrollHeight
            ? [n + 1, scrollHeight]
            : [n, prevScrollHeight]
        })
      }
    }
    document.addEventListener('scroll', onScroll)
    return () => document.removeEventListener('scroll', onScroll)
  }, [pageNum])

  return (
    <div className="mx-auto mt-12 px-10">
      {!isFetched ? (
        <div className="flex flex-wrap justify-center gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          <Card skeleton header={<></>} subHeader={<></>} />
          <Card skeleton header={<></>} subHeader={<></>} />
          <Card skeleton header={<></>} subHeader={<></>} />
          <Card skeleton header={<></>} subHeader={<></>} />
          <Card skeleton header={<></>} subHeader={<></>} />
          <Card skeleton header={<></>} subHeader={<></>} />
          <Card skeleton header={<></>} subHeader={<></>} />
          <Card skeleton header={<></>} subHeader={<></>} />
        </div>
      ) : tokenDatas && tokenDatas.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {tokenDatas?.slice(0, PAGE_SIZE * pageNum[0]).map((tokenData, i) => (
            <Card
              key={`${getMintfromTokenData(tokenData)}-${i}`}
              className={`${handleClick && 'cursor-pointer'} ${
                isSelected(tokenData, selectedTokens ?? [])
                  ? 'border-[1px] border-secondary'
                  : ''
              }`}
              css={css`
                box-shadow: ${isSelected(tokenData, selectedTokens ?? [])
                  ? `0px 0px 30px ${config.colors.accent}`
                  : ''};
              `}
              onClick={() => {
                handleClick && handleClick(tokenData)
              }}
              hero={
                <NFT
                  tokenData={tokenData}
                  displayInvalidationInfo={displayInvalidationInfo}
                />
              }
              header={<NFTHeader tokenData={tokenData} />}
              content={
                tokenData.tokenManager ? (
                  {
                    [TokenManagerState.Initialized]: <></>,
                    [TokenManagerState.Issued]: (
                      <div className="flex h-full w-full flex-row items-center justify-between text-sm">
                        <NFTIssuerInfo tokenData={tokenData} />
                        <NFTClaimButton
                          tokenData={tokenData}
                          tokenDatas={tokenDatas}
                        />
                      </div>
                    ),
                    [TokenManagerState.Claimed]: (
                      <div className="flex h-full flex-row justify-between text-sm">
                        <NFTIssuerInfo tokenData={tokenData} />
                        <NFTViewRental tokenData={tokenData} />
                      </div>
                    ),
                    [TokenManagerState.Invalidated]: <></>,
                  }[tokenData?.tokenManager?.parsed.state as TokenManagerState]
                ) : elligibleForRent(config, tokenData) ? (
                  <div className="flex h-full items-end justify-end">
                    <ButtonSmall
                      disabled={!walletId}
                      className="inline-block flex-none px-4 py-2 text-lg"
                      onClick={async () => {
                        handleClick && handleClick(tokenData)
                      }}
                    >
                      Select
                    </ButtonSmall>
                  </div>
                ) : (
                  <></>
                )
              }
            />
          ))}
        </div>
      ) : (
        <div className="my-40 flex w-full flex-col items-center justify-center gap-1">
          <GlyphLargeClose />
          <div className="mt-4 text-medium-4">
            No active {config.displayName} results at this moment...
          </div>
          {refetch && (
            <ButtonSmall onClick={() => refetch()}>Refresh</ButtonSmall>
          )}
        </div>
      )}
    </div>
  )
}
