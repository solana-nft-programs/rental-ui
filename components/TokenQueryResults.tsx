import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { css } from '@emotion/react'
import type { TokenData } from 'api/api'
import { GlyphLargeClose } from 'assets/GlyphLargeClose'
import { Card } from 'common/Card'
import { Glow } from 'common/Glow'
import { Info } from 'common/Info'
import { MultiSelector } from 'common/MultiSelector'
import { elligibleForRent, NFT } from 'common/NFT'
import type { NFTAtrributeFilterValues } from 'common/NFTAttributeFilters'
import {
  filterTokensByAttributes,
  getNFTAtrributeFilters,
} from 'common/NFTAttributeFilters'
import { NFTHeader } from 'common/NFTHeader'
import { NFTIssuerInfo } from 'common/NFTIssuerInfo'
import { NFTRevokeButton } from 'common/NFTRevokeButton'
import { notify } from 'common/Notification'
import { SelecterDrawer } from 'common/SelectedDrawer'
import { TabSelector } from 'common/TabSelector'
import { useWalletId } from 'hooks/useWalletId'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'
import type { UseQueryResult } from 'react-query'

import { PANE_TABS } from './Browse'
import type { ManageTokenGroup, ManageTokenGroupId } from './Manage'
import { tokenGroups } from './Manage'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  setSelectedGroup: (id: ManageTokenGroupId) => void
  tokenQuery: UseQueryResult<TokenData[], unknown>
  tokenGroup: ManageTokenGroup
  attributeFilterOptions: NFTAtrributeFilterValues
}

const isSelected = (tokenData: TokenData, selectedTokens: TokenData[]) => {
  return selectedTokens.some(
    (t) =>
      t.tokenAccount?.account.data.parsed.info.mint.toString() ===
      tokenData.tokenAccount?.account.data.parsed.info.mint.toString()
  )
}

export const TokenQueryResults: React.FC<Props> = ({
  setSelectedGroup,
  tokenQuery,
  tokenGroup,
  attributeFilterOptions,
}: Props) => {
  const { config } = useProjectConfig()
  const walletId = useWalletId()

  const [selectedTokens, setSelectedTokens] = useState<TokenData[]>([])
  const [selectedFilters, setSelectedFilters] =
    useState<NFTAtrributeFilterValues>({})
  const allTokens = tokenQuery.data ?? []
  const filteredAndSortedTokens = filterTokensByAttributes(
    allTokens,
    selectedFilters
  )
  return (
    <>
      <SelecterDrawer
        selectedTokens={selectedTokens}
        onClose={() => setSelectedTokens([])}
      />
      <div className="mx-10 mt-4 flex items-end gap-2">
        <div className="text-xl text-light-0">Results</div>
        <div className="relative -top-[0.6px] text-base text-medium-4">
          {filteredAndSortedTokens.length}{' '}
        </div>
      </div>
      <div className="mx-10 mt-4 flex flex-wrap justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <TabSelector<ManageTokenGroupId>
            defaultOption={{
              value: 'all',
              label: tokenGroup?.header,
            }}
            options={tokenGroups(walletId).map((g) => ({
              label: g.header,
              value: g.id,
            }))}
            onChange={(o) => {
              setSelectedTokens([])
              setSelectedGroup(o.value)
            }}
          />
          <MultiSelector<string>
            placeholder="Select filters"
            defaultValue={
              Object.values(selectedFilters).reduce(
                (acc, v) => acc + v.length,
                0
              ) > 0 ? (
                <div className="text-light-0">
                  {Object.values(selectedFilters).reduce(
                    (acc, v) => acc + v.length,
                    0
                  )}{' '}
                  filter applied
                </div>
              ) : undefined
            }
            groups={getNFTAtrributeFilters({
              config,
              sortedAttributes: attributeFilterOptions,
              selectedFilters,
              setSelectedFilters,
            })}
          />
        </div>
        <div className="flex">
          <Glow scale={1.5} opacity={1}>
            <TabSelector defaultOption={PANE_TABS[0]} options={PANE_TABS} />
          </Glow>
        </div>
      </div>
      <Info section={tokenGroup} />
      <div className="mx-auto mt-12 max-w-[1634px]">
        {!tokenQuery.isFetched ? (
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
        ) : filteredAndSortedTokens && filteredAndSortedTokens.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-4 xl:justify-start">
            {filteredAndSortedTokens.map((tokenData) => (
              <Card
                key={tokenData.tokenManager?.pubkey.toString()}
                className={`cursor-pointer ${
                  isSelected(tokenData, selectedTokens)
                    ? 'border-[1px] border-secondary'
                    : ''
                }`}
                css={css`
                  box-shadow: ${isSelected(tokenData, selectedTokens)
                    ? `0px 0px 30px ${config.colors.secondary}`
                    : ''};
                `}
                onClick={() => {
                  if (isSelected(tokenData, selectedTokens)) {
                    setSelectedTokens(
                      selectedTokens.filter(
                        (t) =>
                          t.tokenAccount?.account.data.parsed.info.mint.toString() !==
                          tokenData.tokenAccount?.account.data.parsed.info.mint.toString()
                      )
                    )
                  } else if (elligibleForRent(config, tokenData)) {
                    setSelectedTokens([...selectedTokens, tokenData])
                  } else {
                    notify({
                      message: 'Not elligible',
                      description: 'This token is not ellgibile for rent!',
                    })
                  }
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
                        <NFTRevokeButton
                          tokenData={tokenData}
                          callback={() => tokenQuery.refetch()}
                        />
                      </div>
                    ),
                    [TokenManagerState.Invalidated]: <></>,
                  }[tokenData?.tokenManager?.parsed.state as TokenManagerState]
                }
              />
            ))}
          </div>
        ) : (
          <div className="my-10 flex w-full flex-col items-center justify-center gap-1">
            <GlyphLargeClose />
            <div className="mt-4 text-medium-4">
              No active {config.displayName} results at this moment...
            </div>
          </div>
        )}
      </div>
    </>
  )
}
