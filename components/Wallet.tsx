import { DisplayAddress } from '@cardinal/namespaces-components'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { css } from '@emotion/react'
import { useWallet } from '@solana/wallet-adapter-react'
import type { TokenData } from 'api/api'
import { Airdrop } from 'common/Airdrop'
import { Card } from 'common/Card'
import { Glow } from 'common/Glow'
import { HeaderSlim } from 'common/HeaderSlim'
import { HeroSmall } from 'common/HeroSmall'
import { Info } from 'common/Info'
import { MultiSelector } from 'common/MultiSelector'
import { elligibleForRent, NFT } from 'common/NFT'
import { stateColor } from 'common/NFTOverlay'
import { notify } from 'common/Notification'
import { TabSelector } from 'common/TabSelector'
import { asWallet } from 'common/Wallets'
import type { TokenSection } from 'config/config'
import type { UserTokenData } from 'hooks/useUserTokenData'
import { useUserTokenData } from 'hooks/useUserTokenData'
import { lighten } from 'polished'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { filterTokens, useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'
import { Button } from 'rental-components/common/Button'
import { useRentalModal } from 'rental-components/RentalModalProvider'

import { filterTokensByAttributes, getAllAttributes, PANE_TABS } from './Browse'

export const Wallet = () => {
  const { connection, secondaryConnection, environment } = useEnvironmentCtx()
  const wallet = useWallet()
  const { config } = useProjectConfig()
  const userTokenDatas = useUserTokenData(config.filter)
  const rentalModal = useRentalModal()
  const [selectedTokens, setSelectedTokens] = useState<TokenData[]>([])
  const [selectedGroup, setSelectedGroup] = useState(0)
  const [selectedFilters, setSelectedFilters] = useState<{
    [filterName: string]: string[]
  }>({})

  const isSelected = (tokenData: TokenData) => {
    return selectedTokens.some(
      (t) =>
        t.tokenAccount?.account.data.parsed.info.mint.toString() ===
        tokenData.tokenAccount?.account.data.parsed.info.mint.toString()
    )
  }

  const handleNFTSelect = (tokenData: TokenData) => {
    if (isSelected(tokenData)) {
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
  }

  const groupTokens = (tokens: UserTokenData[]): TokenSection[] =>
    tokens.reduce(
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
      [
        {
          header: 'Available',
          description:
            'View and select all tokens available for rent on this marketplace',
          icon: 'available',
          filter: {
            type: 'owner',
            value: [wallet.publicKey?.toString() || ''],
          },
        } as TokenSection,
        {
          header: 'Rented',
          description:
            'View all your currently rented tokens on this marketplace',
          icon: 'performance',
          filter: {
            type: 'claimer',
            value: [wallet.publicKey?.toString() || ''],
          },
        } as TokenSection,
      ]
    )

  const sortedAttributes = getAllAttributes(userTokenDatas.data ?? [])
  const filteredAndSortedTokens: TokenData[] = filterTokensByAttributes(
    userTokenDatas.data ?? [],
    selectedFilters
  )
  const groupedFilteredAndSortedTokens = groupTokens(filteredAndSortedTokens)
  const groupedTokens = groupedFilteredAndSortedTokens[selectedGroup]

  return (
    <>
      <HeaderSlim
        loading={userTokenDatas.isFetched && userTokenDatas.isFetching}
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
      <HeroSmall tokens={[]} />
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
        </div>
        <div className="flex">
          <Glow scale={1.5} opacity={1}>
            <TabSelector defaultOption={PANE_TABS[0]} options={PANE_TABS} />
          </Glow>
        </div>
      </div>
      <Info section={groupedFilteredAndSortedTokens[selectedGroup]} />
      {userTokenDatas.data && userTokenDatas?.data.length > 0 && (
        <div className="container mx-auto mb-5 flex items-end justify-end">
          <Button
            disabled={selectedTokens.length === 0}
            variant="primary"
            className="mr-5"
            bgColor={config.colors.secondary}
            onClick={() =>
              rentalModal.show(
                asWallet(wallet),
                connection,
                environment.label,
                selectedTokens,
                config.rentalCard
              )
            }
          >
            {`Bulk Upload ${
              selectedTokens.length ? `(${selectedTokens.length})` : ''
            }`}
          </Button>
        </div>
      )}
      <div className="mx-auto mt-12 max-w-[1634px]">
        {!userTokenDatas.isFetched ? (
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
              <div
                key={tokenData.tokenAccount?.pubkey.toString()}
                className="relative cursor-pointer rounded-xl"
                style={{
                  boxShadow: selectedTokens.includes(tokenData)
                    ? `0px 0px 30px ${config.colors.secondary}`
                    : '',
                }}
              >
                <NFT
                  key={tokenData?.tokenAccount?.pubkey.toBase58()}
                  tokenData={tokenData}
                  onClick={() => handleNFTSelect(tokenData)}
                />
                <div
                  style={{
                    background: lighten(0.07, config.colors.main),
                  }}
                  className={`flex w-[280px] flex-col rounded-b-md p-3`}
                >
                  <div className="mb-2 flex w-full cursor-pointer flex-row text-xs font-bold text-white">
                    <p className="flex w-fit overflow-hidden text-ellipsis whitespace-nowrap text-left">
                      {tokenData.metadata?.data.name}
                    </p>
                  </div>
                  <div className="flex flex-row justify-between text-xs">
                    {tokenData.recipientTokenAccount?.owner && (
                      <div
                        className="flex flex-col"
                        css={css`
                          color: ${stateColor(TokenManagerState.Claimed, true)};
                        `}
                      >
                        <div className="flex">
                          <span className="inline-block">Issued by&nbsp;</span>
                          <DisplayAddress
                            style={{
                              color: '#52c41a !important',
                              display: 'inline',
                            }}
                            connection={secondaryConnection}
                            address={tokenData.tokenManager?.parsed.issuer}
                            height="18px"
                            width="100px"
                            dark={true}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="white mt-5 flex w-full flex-col items-center justify-center gap-1">
            <div className="text-gray-500">
              {config.type === 'Guild'
                ? "You can't list any tokens for rent as you are not the configured lister"
                : ` No ${config.displayName} NFTs found in wallet...`}
            </div>
            {environment.label === 'devnet' && <Airdrop />}
          </div>
        )}
      </div>
    </>
  )
}
