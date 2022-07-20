import { DisplayAddress } from '@cardinal/namespaces-components'
import { invalidate } from '@cardinal/token-manager'
import { shouldTimeInvalidate } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/utils'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { css } from '@emotion/react'
import { BN } from '@project-serum/anchor'
import type * as splToken from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { GlyphActivity } from 'assets/GlyphActivity'
import { GlyphBrowse } from 'assets/GlyphBrowse'
import { ButtonSmall } from 'common/ButtonSmall'
import { Card } from 'common/Card'
import { Glow } from 'common/Glow'
import { HeaderSlim } from 'common/HeaderSlim'
import { HeroSmall } from 'common/HeroSmall'
import { Info } from 'common/Info'
import { MultiSelector } from 'common/MultiSelector'
import { getAllAttributes, NFT, stateColor } from 'common/NFT'
import { notify } from 'common/Notification'
import { Selector } from 'common/Selector'
import { TabSelector } from 'common/TabSelector'
import { executeTransaction } from 'common/Transactions'
import { fmtMintAmount, getMintDecimalAmount } from 'common/units'
import { getExpirationString, secondsToString } from 'common/utils'
import { asWallet } from 'common/Wallets'
import type { ProjectConfig, TokenSection } from 'config/config'
import {
  allowedToRent,
  useHandleClaimRental,
} from 'handlers/useHandleClaimRental'
import { useFilteredTokenManagers } from 'hooks/useFilteredTokenManagers'
import { PAYMENT_MINTS, usePaymentMints } from 'hooks/usePaymentMints'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import {
  filterTokens,
  getLink,
  useProjectConfig,
} from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'
import { useEffect, useState } from 'react'
import { FaLink } from 'react-icons/fa'
import { AsyncButton } from 'rental-components/common/Button'
import { DURATION_DATA } from 'rental-components/components/RentalCard'
import { useRentalRateModal } from 'rental-components/RentalRateModalProvider'

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
  PriceLowToHigh = 'Price: Low to High',
  PriceHighToLow = 'Price: High to Low',
  DurationLowToHigh = 'Duration: Low to High',
  DurationHighToLow = 'Duration: High to Low',
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

export const getDurationText = (tokenData: TokenData, UTCNow: number) => {
  return tokenData.timeInvalidator?.parsed ? (
    <div className="float-left">
      {tokenData.timeInvalidator?.parsed.durationSeconds &&
      tokenData.timeInvalidator?.parsed.durationSeconds.eq(new BN(0)) &&
      tokenData.timeInvalidator?.parsed.extensionDurationSeconds ? (
        <p
          className={`float-left inline-block text-ellipsis whitespace-nowrap`}
        >
          Max: <b>{getTokenMaxDuration(tokenData, UTCNow).displayText}</b>
        </p>
      ) : tokenData.timeInvalidator?.parsed.durationSeconds ? (
        <p className="float-left inline-block text-ellipsis whitespace-nowrap">
          Fixed Duration:{' '}
          <b>
            {tokenData.timeInvalidator?.parsed.durationSeconds.toNumber()
              ? secondsToString(
                  tokenData.timeInvalidator?.parsed.durationSeconds.toNumber(),
                  false
                )
              : '∞'}
          </b>
        </p>
      ) : tokenData.timeInvalidator?.parsed.expiration ? (
        <p className="float-left inline-block text-ellipsis whitespace-nowrap">
          Expires:{' '}
          <b>
            {getExpirationString(
              tokenData.timeInvalidator?.parsed.expiration?.toNumber(),
              UTCNow
            )}
          </b>
        </p>
      ) : tokenData.timeInvalidator?.parsed.maxExpiration ? (
        <p className="float-left inline-block text-ellipsis whitespace-nowrap">
          Expires:{' '}
          <b>
            {getExpirationString(
              tokenData.timeInvalidator?.parsed.maxExpiration?.toNumber(),
              UTCNow
            )}
          </b>
        </p>
      ) : null}
    </div>
  ) : null
}

export const getSymbolFromTokenData = (tokenData: TokenData) => {
  const symbol = PAYMENT_MINTS.find(
    (mint) =>
      mint.mint ===
      (tokenData.claimApprover?.parsed?.paymentMint.toString() ||
        tokenData.timeInvalidator?.parsed.extensionPaymentMint?.toString())
  )?.symbol
  if (!symbol || symbol === 'SOL') {
    return '◎'
  } else {
    return symbol
  }
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
      rate: parseFloat(
        fmtMintAmount(
          paymentMintInfos[extensionPaymentMint.toString()],
          new BN(marketplaceRate)
        )
      ),
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

const getPriceFromTokenData = (
  tokenData: TokenData,
  paymentMintInfos: { [name: string]: splToken.MintInfo }
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

const getPriceOrRentalRate = (
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

    let duration = 0
    if (tokenData.timeInvalidator?.parsed.durationSeconds) {
      duration = tokenData.timeInvalidator.parsed.durationSeconds.toNumber()
    }
    if (tokenData.timeInvalidator?.parsed.expiration) {
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

export const filterTokensByAttributes = (
  tokens: TokenData[],
  filters: { [filterName: string]: string[] }
): TokenData[] => {
  if (
    Object.keys(filters).length <= 0 ||
    Object.values(filters).filter((v) => v.length > 0).length <= 0
  ) {
    return tokens
  }
  const attributeFilteredTokens: TokenData[] = []
  tokens.forEach((token) => {
    let addToken = false
    Object.keys(filters).forEach((filterName) => {
      if (filters[filterName]!.length > 0) {
        filters[filterName]!.forEach((val) => {
          if (
            token.metadata?.data.attributes.filter(
              (a: { trait_type: string; value: any }) =>
                a.trait_type === filterName && a.value === val
            ).length > 0
          ) {
            addToken = true
          }
        })
      }
    })
    if (addToken) {
      attributeFilteredTokens.push(token)
    }
  })
  return attributeFilteredTokens
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
  const { connection, secondaryConnection, environment } = useEnvironmentCtx()
  const wallet = useWallet()
  const { config } = useProjectConfig()
  const handleClaimRental = useHandleClaimRental()
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
  const rentalRateModal = useRentalRateModal()

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
      case OrderCategories.PriceLowToHigh:
        sortedTokens = tokens.sort((a, b) => {
          return (
            (a.claimApprover?.parsed.paymentAmount.toNumber() ?? 0) -
            (b.claimApprover?.parsed.paymentAmount.toNumber() ?? 0)
          )
        })
        break
      case OrderCategories.PriceHighToLow:
        sortedTokens = tokens.sort((a, b) => {
          return (
            (b.claimApprover?.parsed.paymentAmount.toNumber() ?? 0) -
            (a.claimApprover?.parsed.paymentAmount.toNumber() ?? 0)
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
            ? filterTokens(environment.label, [tk], section.filter)
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
          header: 'Claimed',
          icon: 'info',
          description: 'All currently claimed rentals are displayed below',
          filter: {
            type: 'state',
            value: [TokenManagerState.Claimed.toString()],
          },
        },
      ]
    )
  }

  const handleClaim = async (tokenData: TokenData) => {
    if (
      wallet.publicKey &&
      (await allowedToRent(
        connection,
        wallet.publicKey,
        config,
        tokenData,
        false,
        tokenManagers.data ?? []
      ))
    ) {
      if (tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber() === 0) {
        rentalRateModal.show(
          asWallet(wallet),
          connection,
          environment.label,
          tokenData,
          true
        )
      } else {
        try {
          await handleClaimRental.mutateAsync({ tokenData })
        } catch (e: any) {
          console.log(e)
          notify({
            message: 'Error claiming rental',
            description: e.toString(),
          })
        } finally {
          tokenManagers.refetch()
        }
      }
    }
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
          {
            name: 'Wallet',
            anchor: wallet.publicKey?.toBase58() || 'wallet',
            disabled: !wallet.connected,
            tooltip: !wallet.connected ? 'Connect wallet' : undefined,
          },
          {
            name: 'Manage',
            anchor: 'manage',
            disabled: !wallet.connected || config.disableListing,
            tooltip: !wallet.connected ? 'Connect wallet' : undefined,
          },
          { name: 'Browse', anchor: 'browse' },
        ]}
      />
      <HeroSmall tokens={tokenManagers.data ? filteredAndSortedTokens : []} />
      <div className="mx-10 mt-4 flex items-end gap-[4px] text-light-0">
        <div>Results</div>
        <div className="relative top-[0.6px] text-medium-4">
          {filteredAndSortedTokens.length}{' '}
        </div>
      </div>
      <div className="mx-10 mt-4 flex flex-wrap justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <TabSelector
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
            groups={Object.keys(sortedAttributes).map((traitType) => ({
              label: traitType,
              content: (
                <div key={traitType} className="px-3 pb-3 text-xs">
                  {sortedAttributes[traitType]!.map((value) => (
                    <div
                      key={`${traitType}-${value}`}
                      className="flex items-center justify-between"
                      onClick={() =>
                        setSelectedFilters((filters) => ({
                          ...filters,
                          [traitType]: filters[traitType]?.includes(value)
                            ? filters[traitType]?.filter((v) => v !== value) ??
                              []
                            : [...(filters[traitType] ?? []), value],
                        }))
                      }
                    >
                      <div
                        className="flex cursor-pointer items-center gap-2 py-[2px] text-light-0 transition-colors hover:text-primary"
                        css={css`
                          &:hover {
                            div {
                              border-color: rgb(
                                144 126 255 / var(--tw-border-opacity)
                              );
                            }
                          }
                        `}
                      >
                        <div
                          className={`h-3 w-3 rounded-sm border-[.5px] border-light-1 transition-all`}
                          css={css`
                            background: ${selectedFilters[traitType]?.includes(
                              value
                            )
                              ? config.colors.secondary
                              : ''};
                          `}
                        >
                          {}
                        </div>
                        <div>{value}</div>
                      </div>
                      <div></div>
                    </div>
                  ))}
                </div>
              ),
            }))}
          />
          <Selector<OrderCategories>
            className="mint-w-[190px]"
            defaultOption={{
              label: OrderCategories.RateLowToHigh,
              value: OrderCategories.RateLowToHigh,
            }}
            onChange={(e) => {
              setPageNum(DEFAULT_PAGE)
              setSelectedOrderCategory(e.value)
            }}
            options={(
              Object.values(OrderCategories) as Array<OrderCategories>
            ).map((v) => ({ label: v, value: v }))}
          />
        </div>
        <div className="flex">
          <Glow scale={1.5} opacity={1}>
            <TabSelector defaultOption={PANE_TABS[0]} options={PANE_TABS} />
          </Glow>
        </div>
      </div>
      <Info section={groupedFilteredAndSortedTokens[selectedGroup]} />
      <div className="mx-auto mt-12 max-w-[1634px]">
        {!tokenManagers.isFetched ? (
          <div className="flex flex-wrap justify-center gap-4 xl:justify-start">
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
            <Card skeleton header={<></>} subHeader={<></>} />
          </div>
        ) : groupedTokens?.tokens && groupedTokens.tokens.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-4 xl:justify-start">
            {groupedTokens?.tokens
              ?.slice(0, PAGE_SIZE * pageNum[0])
              .map((tokenData) => (
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

                          <ButtonSmall
                            disabled={!wallet.publicKey}
                            className="my-auto inline-block max-w-[45%] flex-none text-xs"
                            onClick={() => handleClaim(tokenData)}
                          >
                            {tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber() ===
                              0 && paymentMintInfos.data ? (
                              <>
                                {
                                  getTokenRentalRate(
                                    config,
                                    paymentMintInfos.data,
                                    tokenData
                                  )?.displayText
                                }{' '}
                              </>
                            ) : (
                              <>
                                {tokenData.claimApprover?.parsed?.paymentMint &&
                                paymentMintInfos.data &&
                                paymentMintInfos.data[
                                  tokenData.claimApprover?.parsed?.paymentMint.toString()
                                ]
                                  ? `Claim ${parseFloat(
                                      fmtMintAmount(
                                        paymentMintInfos.data[
                                          tokenData?.claimApprover?.parsed?.paymentMint.toString()
                                        ],
                                        tokenData.claimApprover?.parsed
                                          ?.paymentAmount ?? new BN(0)
                                      )
                                    )}${getSymbolFromTokenData(tokenData)}`
                                  : 'FREE'}
                              </>
                            )}
                          </ButtonSmall>
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
                                  address={
                                    tokenData.tokenManager?.parsed.issuer
                                  }
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
                                      callback: tokenManagers.refetch,
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
                            color: ${stateColor(
                              TokenManagerState.Claimed,
                              true
                            )};
                          `}
                        >
                          Invalidated
                        </div>
                      ),
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
            <div className="my-10 flex w-full flex-col items-center justify-center gap-1">
              <div className="text-gray-500">
                No active rentals at this moment...
              </div>
            </div>
          )
        )}
      </div>
    </>
  )
}
