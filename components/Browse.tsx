import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { TokenData } from 'apis/api'
import { GlyphActivity } from 'assets/GlyphActivity'
import { GlyphBrowse } from 'assets/GlyphBrowse'
import { HeaderSlim } from 'common/HeaderSlim'
import { HeroLarge } from 'common/HeroLarge'
import { Info } from 'common/Info'
import { MultiSelector } from 'common/MultiSelector'
import {
  filterTokensByAttributes,
  getAllAttributes,
  getNFTAtrributeFilters,
} from 'common/NFTAttributeFilters'
import { notify } from 'common/Notification'
import { Selector } from 'common/Selector'
import { TabSelector } from 'common/TabSelector'
import { getPriceOrRentalRate, getRentalDuration } from 'common/tokenDataUtils'
import { Activity } from 'components/Activity'
import type { TokenSection } from 'config/config'
import { useFilteredTokenManagers } from 'hooks/useFilteredTokenManagers'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useWalletId } from 'hooks/useWalletId'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { filterTokens, useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'
import { useState } from 'react'

import { TokenQueryData } from './TokenQueryData'

export const handleCopy = (shareUrl: string) => {
  navigator.clipboard.writeText(shareUrl)
  notify({
    message: 'Share link copied',
    description: 'Paste this link from your clipboard',
  })
}

enum OrderCategories {
  RecentlyListed = 'Recently Listed',
  RateLowToHigh = 'Rate: Low to High',
  RateHighToLow = 'Rate: High to Low',
  DurationLowToHigh = 'Max Duration: Low to High',
  DurationHighToLow = 'Max Duration: High to Low',
}

export const PAGE_SIZE = 5
export const DEFAULT_PAGE: [number, number] = [2, 0]
export type PANE_OPTIONS = 'browse' | 'activity'
export const PANE_TABS: {
  label: JSX.Element
  value: PANE_OPTIONS
  disabled?: boolean
  tooltip?: string
}[] = [
  {
    label: <GlyphBrowse />,
    value: 'browse',
  },
  {
    label: (
      <div className="flex items-center gap-2">
        <GlyphActivity />
        Activity
      </div>
    ),
    value: 'activity',
    disabled: true,
    tooltip: 'Coming soon',
  },
]

export const Browse = () => {
  const { environment } = useEnvironmentCtx()
  const walletId = useWalletId()
  const { config } = useProjectConfig()
  const tokenManagers = useFilteredTokenManagers()
  const tokenManagersForConfig = tokenManagers.data || []
  const { UTCNow } = useUTCNow()
  const paymentMintInfos = usePaymentMints()
  const [selectedOrderCategory, setSelectedOrderCategory] =
    useState<OrderCategories>(OrderCategories.RateLowToHigh)
  const [selectedFilters, setSelectedFilters] = useState<{
    [filterName: string]: string[]
  }>({})
  const [selectedGroup, setSelectedGroup] = useState(0)
  const [pane, setPane] = useState<PANE_OPTIONS>('browse')

  const sortTokens = (tokens: TokenData[]): TokenData[] => {
    let sortedTokens
    switch (selectedOrderCategory) {
      case OrderCategories.RecentlyListed:
        sortedTokens = tokens.sort((a, b) => {
          return (
            (a.tokenManager?.parsed.stateChangedAt.toNumber() ?? 0) -
            (b.tokenManager?.parsed.stateChangedAt.toNumber() ?? 0)
          )
        })
        break
      case OrderCategories.RateLowToHigh:
        sortedTokens = tokens.sort((a, b) => {
          return (
            getPriceOrRentalRate(config, a, paymentMintInfos.data) -
            getPriceOrRentalRate(config, b, paymentMintInfos.data)
          )
        })
        break
      case OrderCategories.RateHighToLow:
        sortedTokens = tokens.sort((a, b) => {
          return (
            getPriceOrRentalRate(config, b, paymentMintInfos.data) -
            getPriceOrRentalRate(config, a, paymentMintInfos.data)
          )
        })
        break
      case OrderCategories.DurationLowToHigh:
        sortedTokens = tokens.sort((a, b) => {
          return (
            getRentalDuration(a, UTCNow, selectedGroup === 1) -
            getRentalDuration(b, UTCNow, selectedGroup === 1)
          )
        })
        break
      case OrderCategories.DurationHighToLow:
        sortedTokens = tokens.sort((a, b) => {
          return (
            getRentalDuration(b, UTCNow, selectedGroup === 1) -
            getRentalDuration(a, UTCNow, selectedGroup === 1)
          )
        })
        break
      default:
        return []
    }
    return sortedTokens
  }

  const groupTokens = (tokens: TokenData[]): TokenSection[] => {
    return tokens.reduce(
      (acc, tk) => {
        let isPlaced = false
        return acc.map((section) => {
          const filteredToken = !isPlaced
            ? filterTokens([tk], section.filter, environment.label)
            : []
          if (filteredToken.length === 0 && !isPlaced) {
            isPlaced = true
            return {
              ...section,
              tokens: [...(section.tokens ?? []), tk],
            }
          }
          return section
        })
      },
      config.sections ?? [
        {
          id: 'available',
          header: 'Available',
          icon: 'info',
          description:
            'All listed tokens currently available to rent are displayed below',
          filter: {
            type: 'state',
            value: [TokenManagerState.Issued.toString()],
          },
          showEmpty: true,
        },
        {
          id: 'rented',
          header: 'Rented',
          icon: 'info',
          description: 'All currently claimed rentals are displayed below',
          showEmpty: true,
          filter: {
            type: 'state',
            value: [TokenManagerState.Claimed.toString()],
          },
        },
      ]
    )
  }

  const sortedAttributes = getAllAttributes(tokenManagersForConfig ?? [])
  const filteredAndSortedTokens: TokenData[] = sortTokens(
    filterTokensByAttributes(tokenManagersForConfig, selectedFilters)
  )
  const groupedFilteredAndSortedTokens = groupTokens(filteredAndSortedTokens)
  const groupedTokens = groupedFilteredAndSortedTokens[selectedGroup]

  return (
    <>
      <HeaderSlim
        loading={tokenManagers.isFetched && tokenManagers.isRefetching}
        tabs={[
          { name: 'Browse', anchor: 'browse' },
          {
            name: 'Manage',
            anchor: 'manage',
            disabled: !walletId,
            tooltip: !walletId ? 'Connect wallet' : undefined,
          },
        ]}
      />
      <HeroLarge />
      <div className="mx-10 mt-4 flex items-end gap-2">
        <div className="text-xl text-light-0">Results</div>
        <div className="relative -top-[0.6px] text-base text-medium-4">
          {groupedTokens?.tokens?.length ?? 0}{' '}
        </div>
      </div>
      <div className="mx-10 mt-4 flex flex-wrap justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <TabSelector
            colorized
            defaultOption={{
              value: 0,
              label: groupedFilteredAndSortedTokens[0]?.header,
            }}
            options={groupedFilteredAndSortedTokens.map((g, i) => ({
              label: g.header,
              value: i,
            }))}
            onChange={(o) => {
              setSelectedGroup(o.value)
            }}
          />
          <MultiSelector<string>
            colorized
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
            onChange={(v) => !v && setSelectedFilters({})}
            groups={getNFTAtrributeFilters({
              tokenDatas: groupedTokens?.tokens,
              config,
              sortedAttributes,
              selectedFilters,
              setSelectedFilters,
            })}
          />
          <Selector<OrderCategories>
            colorized
            className="min-w-[240px]"
            defaultOption={{
              label: OrderCategories.RateLowToHigh,
              value: OrderCategories.RateLowToHigh,
            }}
            onChange={(e) => {
              setSelectedOrderCategory(
                e?.value ?? OrderCategories.RateLowToHigh
              )
            }}
            options={(
              Object.values(OrderCategories) as Array<OrderCategories>
            ).map((v) => ({ label: v, value: v }))}
          />
        </div>
        <div className="flex">
          <TabSelector<PANE_OPTIONS>
            defaultOption={PANE_TABS[0]}
            options={PANE_TABS}
            onChange={(o) => {
              setPane(o.value)
            }}
          />
        </div>
      </div>
      <Info colorized section={groupedFilteredAndSortedTokens[selectedGroup]} />

      {
        {
          activity: <Activity />,
          browse: (
            <TokenQueryData
              isFetched={tokenManagers.isFetched}
              tokenDatas={groupedTokens?.tokens}
            />
          ),
        }[pane]
      }
    </>
  )
}
