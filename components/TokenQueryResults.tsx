import { logConfigEvent } from 'monitoring/amplitude'
import type { TokenData } from 'apis/api'
import { Info } from 'common/Info'
import { MultiSelector } from 'common/MultiSelector'
import type { NFTAtrributeFilterValues } from 'common/NFTAttributeFilters'
import {
  filterTokensByAttributes,
  getNFTAtrributeFilters,
} from 'common/NFTAttributeFilters'
import { notify } from 'common/Notification'
import { RefreshButton } from 'common/RefreshButton'
import { SelecterDrawer } from 'common/SelectedDrawer'
import { TabSelector } from 'common/TabSelector'
import { elligibleForRent } from 'common/tokenDataUtils'
import { useClaimEventsForConfig } from 'hooks/useClaimEventsForConfig'
import { useWalletId } from 'hooks/useWalletId'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'
import type { UseQueryResult } from 'react-query'

import { Activity } from './Activity'
import type { PANE_OPTIONS } from './Browse'
import { PANE_TABS } from './Browse'
import type { ManageTokenGroup, ManageTokenGroupId } from './Manage'
import { manageTokenGroups } from './Manage'
import { TokenQueryData } from './TokenQueryData'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  setSelectedGroup: (id: ManageTokenGroupId) => void
  tokenQuery: Pick<
    UseQueryResult<TokenData[], unknown>,
    'data' | 'isFetched' | 'isFetching' | 'dataUpdatedAt' | 'refetch'
  >
  tokenGroup: ManageTokenGroup
  attributeFilterOptions?: NFTAtrributeFilterValues
}

export const isSelected = (
  tokenData: TokenData,
  selectedTokens: TokenData[]
) => {
  return selectedTokens.some(
    (t) =>
      t.tokenAccount?.parsed.mint.toString() ===
      tokenData.tokenAccount?.parsed.mint.toString()
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
  const [pane, setPane] = useState<PANE_OPTIONS>('browse')
  const [selectedFilters, setSelectedFilters] =
    useState<NFTAtrributeFilterValues>({})
  const allTokens = tokenQuery.data ?? []
  const filteredAndSortedTokens = filterTokensByAttributes(
    allTokens,
    selectedFilters
  )
  const claimEvents = useClaimEventsForConfig(true, walletId)
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
            colorized
            defaultOption={{
              value: 'all',
              label: tokenGroup?.header,
            }}
            options={manageTokenGroups(walletId).map((g) => ({
              label: g.header,
              value: g.id,
            }))}
            onChange={(o) => {
              logConfigEvent('manage: click tab', config, {
                name: o.value,
              })
              setSelectedTokens([])
              setSelectedGroup(o.value)
              setPane('browse')
            }}
          />
          {attributeFilterOptions && (
            <MultiSelector<string>
              colorized
              placeholder="Select filters"
              onChange={(v) => !v && setSelectedFilters({})}
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
                tokenDatas: tokenQuery.data,
                config,
                sortedAttributes: attributeFilterOptions,
                selectedFilters,
                setSelectedFilters,
              })}
            />
          )}
        </div>
        <div className="flex gap-4">
          <RefreshButton
            colorized
            isFetching={
              pane === 'browse' ? tokenQuery.isFetching : claimEvents.isFetching
            }
            dataUpdatdAtMs={
              pane === 'browse'
                ? tokenQuery.dataUpdatedAt
                : claimEvents.dataUpdatedAt
            }
            handleClick={() =>
              pane === 'browse' ? tokenQuery.refetch() : claimEvents.refetch()
            }
          />
          <TabSelector
            defaultOption={PANE_TABS[0]}
            options={PANE_TABS}
            onChange={(o) => {
              logConfigEvent('collection: set pane', config, {
                pane_value: o?.label,
              })
              setPane(o.value)
            }}
          />
        </div>
      </div>
      {pane === 'browse' ? (
        <Info colorized {...tokenGroup} />
      ) : (
        <Info
          colorized
          icon="activity"
          header="Activity"
          description="View recent activity for this collection"
        />
      )}
      {
        {
          activity: <Activity user={walletId} />,
          browse: (
            <TokenQueryData
              tokenDatas={filteredAndSortedTokens}
              isFetched={tokenQuery.isFetched}
              selectedTokens={selectedTokens}
              displayInvalidationInfo={true}
              handleClick={(tokenData) => {
                if (isSelected(tokenData, selectedTokens)) {
                  setSelectedTokens(
                    selectedTokens.filter(
                      (t) =>
                        t.tokenAccount?.parsed.mint.toString() !==
                        tokenData.tokenAccount?.parsed.mint.toString()
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
            />
          ),
        }[pane]
      }
    </>
  )
}
