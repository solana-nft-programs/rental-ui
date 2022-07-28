import { secondsToString } from '@cardinal/common'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { BN } from '@project-serum/anchor'
import type * as splToken from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import type { TokenData } from 'api/api'
import { GlyphActivity } from 'assets/GlyphActivity'
import { GlyphBrowse } from 'assets/GlyphBrowse'
import { GlyphLargeClose } from 'assets/GlyphLargeClose'
import { Card } from 'common/Card'
import { DURATION_DATA } from 'common/DurationInput'
import { Glow } from 'common/Glow'
import { HeaderSlim } from 'common/HeaderSlim'
import { HeroLarge } from 'common/HeroLarge'
import { Info } from 'common/Info'
import { MultiSelector } from 'common/MultiSelector'
import { NFT } from 'common/NFT'
import {
  filterTokensByAttributes,
  getAllAttributes,
  getNFTAtrributeFilters,
} from 'common/NFTAttributeFilters'
import { mintImage, mintSymbol, NFTClaimButton } from 'common/NFTClaimButton'
import { NFTHeader } from 'common/NFTHeader'
import { NFTIssuerInfo } from 'common/NFTIssuerInfo'
import { NFTRevokeButton } from 'common/NFTRevokeButton'
import { notify } from 'common/Notification'
import { Selector } from 'common/Selector'
import { TabSelector } from 'common/TabSelector'
import { fmtMintAmount, getMintDecimalAmount } from 'common/units'
import type { ProjectConfig, TokenSection } from 'config/config'
import { useFilteredTokenManagers } from 'hooks/useFilteredTokenManagers'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { filterTokens, useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'
import { useEffect, useState } from 'react'
import { SolanaLogo } from 'rental-components/common/icons'

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
export const PANE_TABS = [
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

export const getTokenMaxDuration = (tokenData: TokenData, UTCNow: number) => {
  if (tokenData.timeInvalidator?.parsed.maxExpiration) {
    const maxDuration =
      tokenData.timeInvalidator?.parsed.maxExpiration?.toNumber() - UTCNow
    return {
      value: maxDuration,
      displayText: secondsToString(maxDuration, false),
    }
  } else {
    return { value: Infinity, displayText: '∞' }
  }
}

export const getSymbolFromTokenData = (tokenData: TokenData) => {
  return mintSymbol(
    tokenData.claimApprover?.parsed?.paymentMint ??
      tokenData.timeInvalidator?.parsed.extensionPaymentMint
  )
}

export const PaymentMintImage: React.FC<
  {
    width?: number
    height?: number
    tokenData: TokenData
  } & React.HTMLAttributes<HTMLDivElement>
> = ({ tokenData, ...props }: { tokenData: TokenData }) => {
  const img = mintImage(
    tokenData.claimApprover?.parsed?.paymentMint ??
      tokenData.timeInvalidator?.parsed.extensionPaymentMint
  )
  return img ? (
    <img {...props} src={img} alt={tokenData.metaplexData?.data.data.name} />
  ) : (
    <SolanaLogo {...props} />
  )
}

export function getTokenRentalRate(
  config: ProjectConfig,
  paymentMintInfos: { [name: string]: splToken.MintInfo },
  tokenData: TokenData
) {
  const rateOption = config.marketplaceRate ?? 'weeks'
  const rateSeconds = new BN(DURATION_DATA[rateOption])
  const {
    extensionPaymentAmount,
    extensionPaymentMint,
    extensionDurationSeconds,
  } = tokenData.timeInvalidator?.parsed || {
    extensionPaymentAmount: null,
    extensionPaymentMint: null,
    extensionDurationOption: null,
  }

  if (
    !extensionPaymentAmount ||
    !extensionPaymentMint ||
    !extensionDurationSeconds
  ) {
    return null
  }

  const marketplaceRate =
    (extensionPaymentAmount.toNumber() / extensionDurationSeconds.toNumber()) *
    rateSeconds.toNumber()

  try {
    return {
      rate: paymentMintInfos[extensionPaymentMint.toString()]
        ? getMintDecimalAmount(
            paymentMintInfos[extensionPaymentMint.toString()]!,
            new BN(marketplaceRate)
          ).toNumber()
        : 0,
      displayText: `${fmtMintAmount(
        paymentMintInfos[extensionPaymentMint.toString()],
        new BN(marketplaceRate)
      )} ${getSymbolFromTokenData(tokenData)} / ${rateOption?.substring(
        0,
        rateOption.length - 1
      )}`,
    }
  } catch (e) {
    return null
  }
}

export const getPriceFromTokenData = (
  tokenData: TokenData,
  paymentMintInfos?: { [name: string]: splToken.MintInfo }
): number => {
  if (
    tokenData.claimApprover?.parsed &&
    tokenData.claimApprover?.parsed?.paymentMint.toString() &&
    paymentMintInfos
  ) {
    const mintInfo =
      paymentMintInfos[tokenData.claimApprover?.parsed?.paymentMint.toString()]
    if (mintInfo) {
      return getMintDecimalAmount(
        mintInfo,
        tokenData.claimApprover?.parsed?.paymentAmount
      ).toNumber()
    } else {
      return 0
    }
  } else {
    return 0
  }
}

export const getPriceOrRentalRate = (
  config: ProjectConfig,
  tokenData: TokenData,
  paymentMintInfos?: { [name: string]: splToken.MintInfo }
) => {
  if (!paymentMintInfos) return 0

  const rate = DURATION_DATA[config.marketplaceRate ?? 'days']
  if (tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber() === 0) {
    return getTokenRentalRate(config, paymentMintInfos, tokenData)?.rate ?? 0
  } else {
    const price = getPriceFromTokenData(tokenData, paymentMintInfos)
    if (price === 0) return 0

    let duration = Infinity
    if (tokenData.timeInvalidator?.parsed.durationSeconds) {
      duration = tokenData.timeInvalidator.parsed.durationSeconds.toNumber()
    } else if (tokenData.timeInvalidator?.parsed.expiration) {
      duration =
        tokenData.timeInvalidator.parsed.expiration.toNumber() -
        Date.now() / 1000
    }
    if (tokenData.timeInvalidator?.parsed.maxExpiration) {
      duration = Math.min(
        duration,
        tokenData.timeInvalidator.parsed.maxExpiration.toNumber() -
          Date.now() / 1000
      )
    }
    return (price / duration) * rate
  }
}

const getRentalDuration = (tokenData: TokenData, UTCNow: number) => {
  if (tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber() === 0) {
    return getTokenMaxDuration(tokenData, UTCNow).value
  } else if (tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber()) {
    return tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber()
  } else if (tokenData.timeInvalidator?.parsed.expiration?.toNumber()) {
    return tokenData.timeInvalidator?.parsed.expiration?.toNumber() - UTCNow
  } else {
    return 0
  }
}

export const Browse = () => {
  const { environment } = useEnvironmentCtx()
  const wallet = useWallet()
  const { config } = useProjectConfig()
  const tokenManagers = useFilteredTokenManagers()
  const tokenManagersForConfig = tokenManagers.data || []
  const { UTCNow } = useUTCNow()
  const [pageNum, setPageNum] = useState<[number, number]>(DEFAULT_PAGE)
  const paymentMintInfos = usePaymentMints()
  const [selectedOrderCategory, setSelectedOrderCategory] =
    useState<OrderCategories>(OrderCategories.RateLowToHigh)
  const [selectedFilters, setSelectedFilters] = useState<{
    [filterName: string]: string[]
  }>({})
  const [selectedGroup, setSelectedGroup] = useState(0)

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
          return getRentalDuration(a, UTCNow) - getRentalDuration(b, UTCNow)
        })
        break
      case OrderCategories.DurationHighToLow:
        sortedTokens = tokens.sort((a, b) => {
          return getRentalDuration(b, UTCNow) - getRentalDuration(a, UTCNow)
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
          // {
          //   name: 'Wallet',
          //   anchor: wallet.publicKey?.toBase58() || 'wallet',
          //   disabled: !wallet.connected,
          //   tooltip: !wallet.connected ? 'Connect wallet' : undefined,
          // },
          { name: 'Browse', anchor: 'browse' },
          {
            name: 'Manage',
            anchor: 'manage',
            disabled: !wallet.connected || config.disableListing,
            tooltip: !wallet.connected ? 'Connect wallet' : undefined,
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
              setPageNum(DEFAULT_PAGE)
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
            className="mint-w-[190px]"
            defaultOption={{
              label: OrderCategories.RateLowToHigh,
              value: OrderCategories.RateLowToHigh,
            }}
            onChange={(e) => {
              setPageNum(DEFAULT_PAGE)
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
          <Glow scale={1.5} opacity={1} colorized>
            <TabSelector defaultOption={PANE_TABS[0]} options={PANE_TABS} />
          </Glow>
        </div>
      </div>
      <Info section={groupedFilteredAndSortedTokens[selectedGroup]} />
      <div className="mx-auto mt-12 px-10">
        {!tokenManagers.isFetched ? (
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
        ) : groupedTokens?.tokens && groupedTokens.tokens.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {groupedTokens?.tokens
              ?.slice(0, PAGE_SIZE * pageNum[0])
              .map((tokenData) => (
                <Card
                  key={tokenData.tokenManager?.pubkey.toString()}
                  hero={<NFT tokenData={tokenData} />}
                  header={<NFTHeader tokenData={tokenData} />}
                  content={
                    {
                      [TokenManagerState.Initialized]: <></>,
                      [TokenManagerState.Issued]: (
                        <div className="flex w-full flex-row justify-between text-sm">
                          <NFTIssuerInfo tokenData={tokenData} />
                          <NFTClaimButton
                            tokenData={tokenData}
                            tokenDatas={tokenManagers.data}
                          />
                        </div>
                      ),
                      [TokenManagerState.Claimed]: (
                        <div className="flex flex-row justify-between text-sm">
                          <NFTIssuerInfo tokenData={tokenData} />
                          <NFTRevokeButton tokenData={tokenData} />
                        </div>
                      ),
                      [TokenManagerState.Invalidated]: <></>,
                    }[
                      tokenData?.tokenManager?.parsed.state as TokenManagerState
                    ]
                  }
                ></Card>
              ))}
          </div>
        ) : (
          groupedTokens &&
          groupedTokens.showEmpty && (
            <div className="my-40 flex w-full flex-col items-center justify-center gap-1">
              <GlyphLargeClose />
              <div className="mt-4 text-medium-4">
                No active rentals at this moment...
              </div>
            </div>
          )
        )}
      </div>
    </>
  )
}
