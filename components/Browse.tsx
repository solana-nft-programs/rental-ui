import { tryPublicKey } from '@cardinal/common'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type * as splToken from '@solana/spl-token'
import type { Keypair, PublicKey } from '@solana/web3.js'
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
import { RefreshButton } from 'common/RefreshButton'
import { Selector } from 'common/Selector'
import { TabSelector } from 'common/TabSelector'
import {
  getPriceOrRentalRate,
  getRentalDuration,
  isClaimable,
} from 'common/tokenDataUtils'
import { Activity } from 'components/Activity'
import type { ProjectConfig, TokenFilter } from 'config/config'
import type { BrowseAvailableTokenData } from 'hooks/useBrowseAvailableTokenDatas'
import {
  filterPaymentMints,
  useBrowseAvailableTokenDatas,
} from 'hooks/useBrowseAvailableTokenDatas'
import type { BrowseClaimedTokenData } from 'hooks/useBrowseClaimedTokenDatas'
import { useBrowseClaimedTokenDatas } from 'hooks/useBrowseClaimedTokenDatas'
import { useClaimEventsForConfig } from 'hooks/useClaimEventsForConfig'
import { useOtp } from 'hooks/useOtp'
import { mintSymbol, usePaymentMints } from 'hooks/usePaymentMints'
import { useTokenManagersForConfig } from 'hooks/useTokenManagersForConfig'
import { useWalletId } from 'hooks/useWalletId'
import { logConfigEvent } from 'monitoring/amplitude'
import { filterTokens, useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'
import { useState } from 'react'

import { TokenQueryData } from './TokenQueryData'

enum OrderCategories {
  RecentlyListed = 'Recently Listed',
  RateLowToHigh = 'Rate: Low to High',
  RateHighToLow = 'Rate: High to Low',
  DurationLowToHigh = 'Max Duration: Low to High',
  DurationHighToLow = 'Max Duration: High to Low',
}

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
    tooltip: 'Browse this collection',
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
    tooltip: 'View recent activity',
  },
]

export const tokenSectionsForConfig = (config: ProjectConfig) => {
  return (
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

export function sortTokens<
  T extends Pick<
    TokenData,
    'tokenManager' | 'claimApprover' | 'timeInvalidator'
  >
>(
  tokens: T[],
  selectedOrderCategory: OrderCategories,
  walletId: PublicKey | undefined,
  config: ProjectConfig,
  UTCNow: number,
  claimed: boolean,
  paymentMints: { [name: string]: Pick<splToken.Mint, 'decimals'> },
  otpKeypair: Keypair | undefined
): T[] {
  let sortedTokens
  switch (selectedOrderCategory) {
    case OrderCategories.RecentlyListed:
      sortedTokens = tokens.sort((a, b) => {
        if (
          isClaimable(a, walletId, otpKeypair) &&
          !isClaimable(b, walletId, otpKeypair)
        ) {
          return -1
        } else if (
          !isClaimable(a, walletId, otpKeypair) &&
          isClaimable(b, walletId, otpKeypair)
        ) {
          return 1
        } else {
          return (
            (b.tokenManager?.parsed.stateChangedAt.toNumber() ?? 0) -
            (a.tokenManager?.parsed.stateChangedAt.toNumber() ?? 0)
          )
        }
      })
      break
    case OrderCategories.RateLowToHigh:
      sortedTokens = tokens.sort((a, b) => {
        if (
          isClaimable(a, walletId, otpKeypair) &&
          !isClaimable(b, walletId, otpKeypair)
        ) {
          return -1
        } else if (
          !isClaimable(a, walletId, otpKeypair) &&
          isClaimable(b, walletId, otpKeypair)
        ) {
          return 1
        } else {
          return (
            getPriceOrRentalRate(config, a, paymentMints) -
              getPriceOrRentalRate(config, b, paymentMints) ||
            getRentalDuration(a, UTCNow, claimed) -
              getRentalDuration(b, UTCNow, claimed)
          )
        }
      })
      break
    case OrderCategories.RateHighToLow:
      sortedTokens = tokens.sort((a, b) => {
        if (
          isClaimable(a, walletId, otpKeypair) &&
          !isClaimable(b, walletId, otpKeypair)
        ) {
          return -1
        } else if (
          !isClaimable(a, walletId, otpKeypair) &&
          isClaimable(b, walletId, otpKeypair)
        ) {
          return 1
        } else {
          return (
            getPriceOrRentalRate(config, b, paymentMints) -
              getPriceOrRentalRate(config, a, paymentMints) ||
            getRentalDuration(a, UTCNow, claimed) -
              getRentalDuration(b, UTCNow, claimed)
          )
        }
      })
      break
    case OrderCategories.DurationLowToHigh:
      sortedTokens = tokens.sort((a, b) => {
        if (
          isClaimable(a, walletId, otpKeypair) &&
          !isClaimable(b, walletId, otpKeypair)
        ) {
          return -1
        } else if (
          !isClaimable(a, walletId, otpKeypair) &&
          isClaimable(b, walletId, otpKeypair)
        ) {
          return 1
        } else {
          return (
            getRentalDuration(a, UTCNow, claimed) -
              getRentalDuration(b, UTCNow, claimed) ||
            getPriceOrRentalRate(config, b, paymentMints) -
              getPriceOrRentalRate(config, a, paymentMints)
          )
        }
      })
      break
    case OrderCategories.DurationHighToLow:
      sortedTokens = tokens.sort((a, b) => {
        if (
          isClaimable(a, walletId, otpKeypair) &&
          !isClaimable(b, walletId, otpKeypair)
        ) {
          return -1
        } else if (
          !isClaimable(a, walletId, otpKeypair) &&
          isClaimable(b, walletId, otpKeypair)
        ) {
          return 1
        } else {
          return (
            getRentalDuration(b, UTCNow, claimed) -
              getRentalDuration(a, UTCNow, claimed) ||
            getPriceOrRentalRate(config, b, paymentMints) -
              getPriceOrRentalRate(config, a, paymentMints)
          )
        }
      })
      break
    default:
      return tokens
  }
  return sortedTokens
}

export const Browse = () => {
  const walletId = useWalletId()
  const otpKeypair = useOtp()
  const { config, setSubFilter, subFilter } = useProjectConfig()
  const { UTCNow } = useUTCNow()
  const paymentMintInfos = usePaymentMints()
  const [selectedOrderCategory, setSelectedOrderCategory] =
    useState<OrderCategories>(OrderCategories.RateLowToHigh)
  const [paymentMint, setPaymentMint] = useState<string[] | undefined>()

  const [selectedFilters, setSelectedFilters] = useState<{
    [filterName: string]: string[]
  }>({})
  const tokenSections = tokenSectionsForConfig(config)
  const [selectedGroup, setSelectedGroup] = useState(0)
  const [pane, setPane] = useState<PANE_OPTIONS>('browse')
  const availableTokenDatas = useBrowseAvailableTokenDatas(subFilter)
  const claimedTokenDatas = useBrowseClaimedTokenDatas(
    selectedGroup !== 1,
    subFilter
  )
  const tokenManagersForConfig = useTokenManagersForConfig(subFilter)
  const tokenQuery =
    selectedGroup === 0 ? availableTokenDatas : claimedTokenDatas

  const claimEvents = useClaimEventsForConfig(true)

  const sortedAttributes = getAllAttributes([
    ...(availableTokenDatas.data ?? []),
    ...(claimedTokenDatas.data ?? []),
  ])
  const tokenDatas = tokenQuery.data ?? []
  const attrFilteredAndSortedTokens = sortTokens(
    filterTokensByAttributes<BrowseAvailableTokenData | BrowseClaimedTokenData>(
      tokenDatas,
      selectedFilters
    ),
    selectedOrderCategory,
    walletId,
    config,
    UTCNow,
    selectedGroup === 1,
    paymentMintInfos.data ?? {},
    otpKeypair
  )

  // safety check due to stale data stuck in the index
  const filteredAndSortedTokens = filterPaymentMints(
    filterTokens(
      attrFilteredAndSortedTokens,
      tokenSections[selectedGroup]?.filter
    ),
    config,
    paymentMint
  )
  return (
    <>
      <HeaderSlim
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
      <div className="mx-10 mt-4 flex items-center gap-2">
        <div className="text-xl text-light-0">Results</div>
        {!tokenQuery.isFetched ? (
          <div className="h-6 w-8 animate-pulse rounded-md bg-border" />
        ) : (
          <div className="text-base text-medium-4">
            {filteredAndSortedTokens?.length ?? 0}{' '}
          </div>
        )}
      </div>
      <div className="mx-10 mt-4 flex flex-wrap justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          {config.subFilters && config.subFilters[0]?.filter && (
            <Selector<TokenFilter>
              z={50}
              colorized
              highlight
              className="min-w-[140px]"
              defaultOption={{
                label: config.subFilters[0]?.label ?? 'Unknwnown',
                value: config.subFilters[0]?.filter,
              }}
              onChange={(e) => {
                logConfigEvent('collection: select sub filter', config, {
                  sort_type: e?.value ?? 'Unknown',
                })
                e?.value && setSubFilter(e.value)
              }}
              options={config.subFilters.map(({ label, filter }) => ({
                label,
                value: filter,
              }))}
            />
          )}
          <TabSelector
            colorized
            defaultOption={{
              value: 0,
              label: tokenSections[0]?.header,
            }}
            options={tokenSections.map((g, i) => ({
              label: g.header,
              value: i,
            }))}
            onChange={(o) => {
              setSelectedGroup(o.value)
              setPane('browse')
            }}
          />

          {Object.keys(sortedAttributes).length > 0 && (
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
                tokenDatas,
                config,
                sortedAttributes,
                selectedFilters,
                setSelectedFilters,
              })}
            />
          )}
          <Selector<OrderCategories>
            colorized
            className="min-w-[240px]"
            defaultOption={{
              label: OrderCategories.RateLowToHigh,
              value: OrderCategories.RateLowToHigh,
            }}
            onChange={(e) => {
              logConfigEvent('collection: sort tokens', config, {
                sort_type: e?.value ?? OrderCategories.RateLowToHigh,
              })
              setSelectedOrderCategory(
                e?.value ?? OrderCategories.RateLowToHigh
              )
            }}
            options={(
              Object.values(OrderCategories) as Array<OrderCategories>
            ).map((v) => ({ label: v, value: v }))}
          />
          {config.allowNonSol &&
            config.rentalCard.invalidationOptions?.paymentMints &&
            config.rentalCard.invalidationOptions?.paymentMints?.length > 1 && (
              <Selector<string | undefined>
                colorized
                className="min-w-[120px]"
                defaultOption={{
                  label: 'Any Token',
                  value: undefined,
                }}
                onChange={(e) => {
                  logConfigEvent('collection: select payment mint', config, {
                    sort_type: e?.value,
                  })
                  setPaymentMint(e?.value ? [e?.value] : undefined)
                }}
                options={[
                  {
                    label: 'Any Token',
                    value: undefined,
                  },
                  ...(config.rentalCard.invalidationOptions?.paymentMints).map(
                    (v) => ({
                      label: mintSymbol(tryPublicKey(v)),
                      value: v,
                    })
                  ),
                ]}
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
              pane === 'browse'
                ? Promise.all([
                    tokenQuery.refetch(),
                    tokenManagersForConfig.refetch(),
                  ])
                : claimEvents.refetch()
            }
          />
          <TabSelector<PANE_OPTIONS>
            colorized
            defaultOption={PANE_TABS[0]}
            options={PANE_TABS}
            value={PANE_TABS.find((p) => p.value === pane)}
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
        <Info colorized {...tokenSections[selectedGroup]} />
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
          activity: <Activity />,
          browse: (
            <TokenQueryData
              isFetched={tokenQuery.isFetched}
              isFetching={tokenQuery.isFetching}
              tokenDatas={filteredAndSortedTokens}
            />
          ),
        }[pane]
      }
    </>
  )
}
