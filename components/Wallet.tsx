import { DisplayAddress } from '@cardinal/namespaces-components'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { useWallet } from '@solana/wallet-adapter-react'
import type { TokenData } from 'api/api'
import { Airdrop } from 'common/Airdrop'
import { HeaderSlim } from 'common/HeaderSlim'
import { elligibleForRent, NFT, NFTPlaceholder, TokensOuter } from 'common/NFT'
import { notify } from 'common/Notification'
import { Tag } from 'common/Tags'
import { asWallet } from 'common/Wallets'
import type { TokenSection } from 'config/config'
import type { UserTokenData } from 'hooks/useUserTokenData'
import { useUserTokenData } from 'hooks/useUserTokenData'
import { lighten } from 'polished'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { filterTokens, useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'
import { AiFillStar, AiOutlineShoppingCart } from 'react-icons/ai'
import { MdAccessTimeFilled, MdOutlineSell } from 'react-icons/md'
import { Button } from 'rental-components/common/Button'
import { useRentalModal } from 'rental-components/RentalModalProvider'

export const Wallet = () => {
  const { connection, secondaryConnection, environment } = useEnvironmentCtx()
  const wallet = useWallet()
  const { config } = useProjectConfig()
  const tokenDatas = useUserTokenData()
  const rentalModal = useRentalModal()
  const [selectedTokens, setSelectedTokens] = useState<TokenData[]>([])

  const filteredTokenDatas = filterTokens(
    environment.label,
    tokenDatas.data || [],
    config.filter
  ).filter(
    (tk) =>
      !(config.type === 'Guild') ||
      (config.type === 'Guild' &&
        config.filter?.value.includes(
          tk.tokenAccount?.account.data.parsed.info.owner.toString()
        ))
  )

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
          header: 'Available For Rent',
          icon: 'available',
          filter: {
            type: 'owner',
            value: [wallet.publicKey?.toString() || ''],
          },
        } as TokenSection,
        {
          header: 'Rented Tokens',
          icon: 'rented',
          filter: {
            type: 'claimer',
            value: [wallet.publicKey?.toString() || ''],
          },
        } as TokenSection,
      ]
    )

  const sortTokens = (tokens: UserTokenData[]): UserTokenData[] => {
    return tokens
  }

  const filteredAndSortedTokens: TokenData[] = sortTokens(filteredTokenDatas)
  const groupedFilteredAndSortedTokens = groupTokens(filteredAndSortedTokens)
  return (
    <>
      <HeaderSlim
        loading={tokenDatas.isFetched && tokenDatas.isFetching}
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
      <div className="mt-10 px-5">
        {filteredTokenDatas && filteredTokenDatas.length > 0 && (
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
        {!tokenDatas.isFetched ? (
          <TokensOuter>
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
            <NFTPlaceholder />
          </TokensOuter>
        ) : (
          filteredTokenDatas &&
          filteredTokenDatas.length > 0 &&
          groupedFilteredAndSortedTokens.map(
            (tokenGroup) =>
              tokenGroup.tokens &&
              tokenGroup.tokens.length > 0 && (
                <>
                  <div className="mb-10">
                    <div className="flex items-center gap-2 text-2xl text-white">
                      {tokenGroup.icon &&
                        {
                          time: <MdAccessTimeFilled />,
                          featured: <AiFillStar />,
                          listed: <AiOutlineShoppingCart />,
                          rented: <AiOutlineShoppingCart />,
                          available: <MdOutlineSell />,
                        }[tokenGroup.icon]}
                      {tokenGroup.header}
                    </div>
                    <div
                      className="text-lg"
                      style={{
                        color: lighten(0.4, config.colors.main),
                      }}
                    >
                      {tokenGroup.description}
                    </div>
                  </div>
                  <TokensOuter>
                    {tokenGroup.tokens.map((tokenData) => (
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
                              {tokenData.metadata.data.name}
                            </p>
                          </div>
                          <div className="flex flex-row justify-between text-xs">
                            {tokenData.recipientTokenAccount?.owner && (
                              <Tag state={TokenManagerState.Claimed}>
                                <div className="flex flex-col">
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </TokensOuter>
                </>
              )
          )
        )}
        {filteredAndSortedTokens.length === 0 && (
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
