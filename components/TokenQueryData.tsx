import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { css } from '@emotion/react'
import type { TokenData } from 'api/api'
import { GlyphLargeClose } from 'assets/GlyphLargeClose'
import { Card } from 'common/Card'
import { NFT } from 'common/NFT'
import type { NFTAtrributeFilterValues } from 'common/NFTAttributeFilters'
import { filterTokensByAttributes } from 'common/NFTAttributeFilters'
import { NFTHeader } from 'common/NFTHeader'
import { NFTIssuerInfo } from 'common/NFTIssuerInfo'
import { NFTRevokeButton } from 'common/NFTRevokeButton'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

import { isSelected } from './TokenQueryResults'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  allTokens?: TokenData[]
  isFetched?: boolean
  attributeFilters: NFTAtrributeFilterValues
  selectedTokens: TokenData[]
  handleClick?: (tokenData: TokenData) => void
}

export const TokenQueryData: React.FC<Props> = ({
  allTokens,
  isFetched,
  attributeFilters,
  selectedTokens,
  handleClick,
}: Props) => {
  const { config } = useProjectConfig()

  const filteredAndSortedTokens = filterTokensByAttributes(
    allTokens ?? [],
    attributeFilters
  )
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
      ) : filteredAndSortedTokens && filteredAndSortedTokens.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filteredAndSortedTokens.map((tokenData) => (
            <Card
              key={`${tokenData.tokenManager?.pubkey.toString()}-${tokenData.tokenAccount?.pubkey.toString()}`}
              className={`cursor-pointer ${
                isSelected(tokenData, selectedTokens)
                  ? 'border-[1px] border-secondary'
                  : ''
              }`}
              css={css`
                box-shadow: ${isSelected(tokenData, selectedTokens)
                  ? `0px 0px 30px ${config.colors.accent}`
                  : ''};
              `}
              onClick={() => {
                handleClick && handleClick(tokenData)
              }}
              hero={<NFT tokenData={tokenData} />}
              header={<NFTHeader tokenData={tokenData} />}
              content={
                {
                  [TokenManagerState.Initialized]: <></>,
                  [TokenManagerState.Issued]: (
                    <div className="flex w-full flex-row justify-between text-sm">
                      <NFTIssuerInfo tokenData={tokenData} />
                    </div>
                  ),
                  [TokenManagerState.Claimed]: (
                    <div className="flex flex-row justify-between text-sm">
                      <NFTIssuerInfo tokenData={tokenData} />
                      <NFTRevokeButton tokenData={tokenData} />
                    </div>
                  ),
                  [TokenManagerState.Invalidated]: <></>,
                }[tokenData?.tokenManager?.parsed.state as TokenManagerState]
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
        </div>
      )}
    </div>
  )
}
