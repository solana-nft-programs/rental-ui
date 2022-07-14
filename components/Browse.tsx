import { withFindOrInitAssociatedTokenAccount } from '@cardinal/common'
import { DisplayAddress, useAddressName } from '@cardinal/namespaces-components'
import { invalidate, withClaimToken } from '@cardinal/token-manager'
import { shouldTimeInvalidate } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/utils'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { css } from '@emotion/react'
import { BN } from '@project-serum/anchor'
import type * as splToken from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { withWrapSol } from 'api/wrappedSol'
import { GlyphActivity } from 'assets/GlyphActivity'
import { GlyphBrowse } from 'assets/GlyphBrowse'
import { GlyphQuestion } from 'assets/GlyphQuestion'
import { BigNumber } from 'bignumber.js'
import { ButtonSmall } from 'common/ButtonSmall'
import { Card } from 'common/Card'
import { Glow } from 'common/Glow'
import { HeaderSlim } from 'common/HeaderSlim'
import { HeroSmall } from 'common/HeroSmall'
import { MultiSelector } from 'common/MultiSelector'
import { NFT, NFTPlaceholder, TokensOuter } from 'common/NFT'
import { notify } from 'common/Notification'
import { Selector } from 'common/Selector'
import { TabSelector } from 'common/TabSelector'
import { Tag } from 'common/Tags'
import { executeTransaction } from 'common/Transactions'
import { fmtMintAmount, getMintDecimalAmount } from 'common/units'
import { getExpirationString, secondsToString } from 'common/utils'
import { asWallet } from 'common/Wallets'
import type { ProjectConfig, TokenSection } from 'config/config'
import { useFilteredTokenManagers } from 'hooks/useFilteredTokenManagers'
import {
  PAYMENT_MINTS,
  usePaymentMints,
  WRAPPED_SOL_MINT,
} from 'hooks/usePaymentMints'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import {
  filterTokens,
  getLink,
  useProjectConfig,
} from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'
import { useState } from 'react'
import { AiFillStar, AiOutlineShoppingCart } from 'react-icons/ai'
import { FaLink } from 'react-icons/fa'
import { MdAccessTimeFilled, MdSell } from 'react-icons/md'
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
  PriceLowToHigh = 'Price: Low to High',
  PriceHighToLow = 'Price: High to Low',
  RateLowToHigh = 'Rate: Low to High',
  RateHighToLow = 'Rate: High to Low',
  DurationLowToHigh = 'Duration: Low to High',
  DurationHighToLow = 'Duration: High to Low',
}

const PANE_TABS = [
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
    disabled: 'Coming soon',
  },
]

const boundsToSeconds: { [key in number]: number } = {
  0: 0,
  20: 3600,
  40: 86400,
  60: 604800,
  80: 2419200,
  100: Infinity,
}

const getAllAttributes = (tokens: TokenData[]) => {
  const allAttributes: { [traitType: string]: Set<any> } = {}
  tokens.forEach((tokenData) => {
    if (
      tokenData?.metadata?.data?.attributes &&
      tokenData?.metadata?.data?.attributes.length > 0
    ) {
      tokenData?.metadata?.data?.attributes.forEach(
        (attribute: { trait_type: string; value: string }) => {
          if (attribute.trait_type in allAttributes) {
            allAttributes[attribute.trait_type]!.add(attribute.value)
          } else {
            allAttributes[attribute.trait_type] = new Set([attribute.value])
          }
        }
      )
    }
  })

  const sortedAttributes: { [traitType: string]: string[] } = {}
  Object.keys(allAttributes).forEach((traitType) => {
    sortedAttributes[traitType] = Array.from(allAttributes[traitType] ?? [])
  })
  return sortedAttributes
}

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

export const Browse = () => {
  const { connection, secondaryConnection, environment } = useEnvironmentCtx()
  const wallet = useWallet()
  const { config } = useProjectConfig()
  const tokenManagers = useFilteredTokenManagers()
  const tokenManagersForConfig = tokenManagers.data || []
  const { UTCNow } = useUTCNow()
  const twitterAddress = useAddressName(
    connection,
    wallet.publicKey ?? undefined
  )

  const [userPaymentTokenAccount, _setUserPaymentTokenAccount] =
    useState<splToken.AccountInfo | null>(null)
  const paymentMintInfos = usePaymentMints()
  const [selectedOrderCategory, setSelectedOrderCategory] =
    useState<OrderCategories>(OrderCategories.RateLowToHigh)
  const [selectedFilters, setSelectedFilters] = useState<{
    [filterName: string]: string[]
  }>({})
  const [selectedGroup, setSelectedGroup] = useState(0)
  const [maxDurationBounds, setMaxDurationBounds] = useState<[number, number]>([
    0,
    Infinity,
  ])
  const [claimingRental, setClaimingRental] = useState<boolean>(false)
  const rentalRateModal = useRentalRateModal()

  const globalRate = DURATION_DATA[config.marketplaceRate ?? 'days']

  const getPriceFromTokenData = (tokenData: TokenData) => {
    if (
      tokenData.claimApprover?.parsed &&
      tokenData.claimApprover?.parsed?.paymentMint.toString() &&
      paymentMintInfos.data
    ) {
      const mintInfo =
        paymentMintInfos.data[
          tokenData.claimApprover?.parsed?.paymentMint.toString()
        ]
      if (mintInfo) {
        return getMintDecimalAmount(
          mintInfo,
          tokenData.claimApprover?.parsed?.paymentAmount
        )
      } else {
        return new BigNumber(0)
      }
    } else {
      return new BigNumber(0)
    }
  }

  const getPriceOrRentalRate = (
    tokenData: TokenData,
    rate: number = globalRate
  ) => {
    let price: BigNumber | undefined = new BigNumber(0)
    if (
      tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber() === 0 &&
      paymentMintInfos.data
    ) {
      return (
        getTokenRentalRate(config, paymentMintInfos.data, tokenData)?.rate ?? 0
      )
    } else {
      price = getPriceFromTokenData(tokenData)
      if (price.toNumber() === 0) return 0
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
      return (price.toNumber() / duration) * rate
    }
  }

  const getRentalDuration = (tokenData: TokenData) => {
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
          return getPriceOrRentalRate(a) - getPriceOrRentalRate(b)
        })
        break
      case OrderCategories.RateHighToLow:
        sortedTokens = tokens.sort((a, b) => {
          return getPriceOrRentalRate(b) - getPriceOrRentalRate(a)
        })
        break
      case OrderCategories.DurationLowToHigh:
        sortedTokens = tokens.sort((a, b) => {
          return getRentalDuration(a) - getRentalDuration(b)
        })
        break
      case OrderCategories.DurationHighToLow:
        sortedTokens = tokens.sort((a, b) => {
          return getRentalDuration(b) - getRentalDuration(a)
        })
        break
      default:
        return []
    }
    return sortedTokens
  }

  const durationAmount = (token: TokenData) => {
    if (
      token.timeInvalidator?.parsed.durationSeconds?.toNumber() === 0 &&
      token.timeInvalidator?.parsed?.maxExpiration?.toNumber()
    ) {
      return token.timeInvalidator?.parsed?.maxExpiration?.toNumber() - UTCNow
    } else if (token.timeInvalidator?.parsed?.expiration?.toNumber()) {
      return token.timeInvalidator?.parsed?.expiration?.toNumber() - UTCNow
    } else {
      return token.timeInvalidator?.parsed?.durationSeconds?.toNumber()
    }
  }

  const filterTokensByAttributes = (tokens: TokenData[]): TokenData[] => {
    const durationTokens = tokens.filter(
      (token) =>
        maxDurationBounds[0] <= (durationAmount(token) ?? Infinity) &&
        maxDurationBounds[1] >= (durationAmount(token) ?? Infinity)
    )
    if (
      Object.keys(selectedFilters).length <= 0 ||
      Object.values(selectedFilters).filter((v) => v.length > 0).length <= 0
    ) {
      return durationTokens
    }
    const attributeFilteredTokens: TokenData[] = []
    durationTokens.forEach((token) => {
      let addToken = false
      Object.keys(selectedFilters).forEach((filterName) => {
        if (selectedFilters[filterName]!.length > 0) {
          selectedFilters[filterName]!.forEach((val) => {
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
          header: 'Active Rentals',
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

  const filteredAndSortedTokens: TokenData[] = sortTokens(
    filterTokensByAttributes(tokenManagersForConfig)
  )

  const groupedFilteredAndSortedTokens = groupTokens(filteredAndSortedTokens)
  const handleClaim = async (tokenData: TokenData) => {
    try {
      setClaimingRental(true)
      if (!tokenData.tokenManager) throw new Error('No token manager data')
      if (!wallet.publicKey) throw new Error('Wallet not connected')
      // wrap sol if there is payment required
      const transaction = new Transaction()
      const paymentMint =
        tokenData?.claimApprover?.parsed.paymentMint ||
        tokenData?.timeInvalidator?.parsed.extensionPaymentMint
      if (
        tokenData?.claimApprover?.parsed.paymentAmount &&
        tokenData?.claimApprover?.parsed.paymentMint.toString() ===
          WRAPPED_SOL_MINT.toString() &&
        tokenData?.claimApprover?.parsed.paymentAmount.gt(new BN(0))
      ) {
        const amountToWrap = tokenData?.claimApprover?.parsed.paymentAmount.sub(
          userPaymentTokenAccount?.amount || new BN(0)
        )
        if (amountToWrap.gt(new BN(0))) {
          await withWrapSol(
            transaction,
            connection,
            asWallet(wallet),
            amountToWrap.toNumber()
          )
        }
      }
      if (paymentMint) {
        await withFindOrInitAssociatedTokenAccount(
          transaction,
          connection,
          paymentMint,
          wallet.publicKey!,
          wallet.publicKey!,
          true
        )
      }
      await withClaimToken(
        transaction,
        environment.secondary
          ? new Connection(environment.secondary)
          : connection,
        asWallet(wallet),
        tokenData.tokenManager?.pubkey
      )
      await executeTransaction(connection, asWallet(wallet), transaction, {
        confirmOptions: {
          commitment: 'confirmed',
          maxRetries: 3,
        },
        signers: [],
        notificationConfig: {},
      })
    } catch (e: any) {
      notify({
        message: 'Error claiming rental',
        description: e.toString(),
      })
      console.log(e)
    } finally {
      setClaimingRental(false)
      tokenManagers.refetch()
    }
  }

  const marks = {
    0: {
      style: {
        color: '#fff',
      },
      label: <span>0</span>,
    },
    20: {
      style: {
        color: '#fff',
      },
      label: <span>1h</span>,
    },
    40: {
      style: {
        color: '#fff',
      },
      label: <span>1d</span>,
    },
    60: {
      style: {
        color: '#fff',
      },
      label: <span>1w</span>,
    },
    80: {
      style: {
        color: '#fff',
      },
      label: <span>4w</span>,
    },
    100: {
      style: {
        color: '#fff',
      },
      label: <span>∞</span>,
    },
  }

  const sortedAttributes = getAllAttributes(tokenManagersForConfig ?? [])

  const handleBrowseClick = async (tokenData: TokenData) => {
    if (config.allowOneByCreators && tokenManagers.data) {
      for (const creator of config.allowOneByCreators) {
        if (creator.preventMultipleClaims && claimingRental) {
          notify({
            message: 'Error renting this NFT',
            description:
              'This issuer has prevented simultaneous rentals, please wait until the current rental claim is approved',
            type: 'error',
          })
          return
        }
        if (creator.enforceTwitter && !twitterAddress.displayName) {
          notify({
            message: 'Error renting this NFT',
            description:
              'You need to connect your twitter account to rent an NFT from this issuer. Click your profile on the top right corner to connect.',
            type: 'error',
          })
          return
        }
        if (
          tokenManagers.data.filter(
            (tm) =>
              tokenData.tokenManager?.parsed.issuer.toString() ===
                creator.address &&
              tm.recipientTokenAccount?.owner.toString() ===
                wallet.publicKey?.toString() &&
              tm.tokenManager?.parsed.issuer.toString() === creator.address
          ).length > 0
        ) {
          notify({
            message: 'Error renting this NFT',
            description:
              'The issuer of this NFT has limited only one NFT rental per user',
            type: 'error',
          })
          return
        }
      }
    }
    if (wallet.publicKey) {
      if (tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber() === 0) {
        rentalRateModal.show(
          asWallet(wallet),
          connection,
          environment.label,
          tokenData,
          true
        )
      } else {
        await handleClaim(tokenData)
      }
    }
  }

  console.log(groupedFilteredAndSortedTokens)

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
          },
          {
            name: 'Manage',
            anchor: 'manage',
            disabled: !wallet.connected || config.disableListing,
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
      <div className="mx-10 mt-4 flex justify-between">
        <div className="flex gap-4">
          <TabSelector
            defaultOption={{
              value: 0,
              label: groupedFilteredAndSortedTokens[0]?.header,
            }}
            options={groupedFilteredAndSortedTokens.map((g, i) => ({
              label: g.header,
              value: i,
            }))}
            onChange={(o) => setSelectedGroup(o.value)}
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
            options={Object.keys(sortedAttributes).map((traitType) => ({
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
            defaultOption={{
              label: OrderCategories.RateLowToHigh,
              value: OrderCategories.RateLowToHigh,
            }}
            onChange={(e) => {
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
      <div className="mx-10 mt-10 flex items-center gap-4 text-xl">
        <div className="text-white">
          {groupedFilteredAndSortedTokens[selectedGroup]?.icon &&
            {
              time: <MdAccessTimeFilled />,
              featured: <AiFillStar />,
              listed: <AiOutlineShoppingCart />,
              rented: <AiOutlineShoppingCart />,
              available: <MdSell />,
              info: <GlyphQuestion />,
            }[groupedFilteredAndSortedTokens[selectedGroup]!.icon!]}
        </div>
        <div className="flex flex-col">
          <div className="text-medium-3">
            {groupedFilteredAndSortedTokens[selectedGroup]?.header}
          </div>
          <div className="text-light-0">
            {groupedFilteredAndSortedTokens[selectedGroup]?.description}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-[1634px]">
        {!tokenManagers.isFetched ? (
          <div className="flex flex-wrap justify-center gap-4 xl:justify-start">
            <Card placeholder header={<></>} subHeader={<></>} />
            <Card placeholder header={<></>} subHeader={<></>} />
            <Card placeholder header={<></>} subHeader={<></>} />
            <Card placeholder header={<></>} subHeader={<></>} />
            <Card placeholder header={<></>} subHeader={<></>} />
            <Card placeholder header={<></>} subHeader={<></>} />
          </div>
        ) : groupedTokens?.tokens && groupedTokens.tokens.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-4 xl:justify-start">
            {groupedTokens?.tokens?.map((tokenData) => (
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
                          <Tag state={TokenManagerState.Issued}>
                            <div className="flex flex-col">
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
                          </Tag>
                        )}

                        <ButtonSmall
                          disabled={!wallet.publicKey}
                          className="my-auto inline-block max-w-[45%] flex-none text-xs"
                          onClick={() => handleBrowseClick(tokenData)}
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
                              Claim{' '}
                              {tokenData.claimApprover?.parsed?.paymentMint &&
                              paymentMintInfos.data &&
                              paymentMintInfos.data[
                                tokenData.claimApprover?.parsed?.paymentMint.toString()
                              ]
                                ? parseFloat(
                                    fmtMintAmount(
                                      paymentMintInfos.data[
                                        tokenData?.claimApprover?.parsed?.paymentMint.toString()
                                      ],
                                      tokenData.claimApprover?.parsed
                                        ?.paymentAmount ?? new BN(0)
                                    )
                                  )
                                : ''}{' '}
                              {getSymbolFromTokenData(tokenData)}{' '}
                            </>
                          )}
                        </ButtonSmall>
                      </div>
                    ),
                    [TokenManagerState.Claimed]: (
                      <div className="flex flex-row justify-between text-sm">
                        {tokenData.recipientTokenAccount?.owner && (
                          <Tag state={TokenManagerState.Claimed}>
                            <div className="flex flex-col">
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
                          </Tag>
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
                      <Tag state={TokenManagerState.Invalidated}>
                        Invalidated
                      </Tag>
                    ),
                  }[tokenData?.tokenManager?.parsed.state as TokenManagerState]
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
