import React, { useEffect, useState } from 'react'
import { NFT, TokensOuter } from 'common/NFT'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { AsyncButton, Button } from 'rental-components/common/Button'
import { notify } from 'common/Notification'
import { shortPubKey } from 'common/utils'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { FaLink } from 'react-icons/fa'
import { invalidate, unissueToken } from '@cardinal/token-manager'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { asWallet } from 'common/Wallets'
import { executeTransaction } from 'common/Transactions'
import { BN } from '@project-serum/anchor'
import { useIssuedTokens } from 'providers/IssuedTokensProvider'
import { findClaimApproverAddress } from '@cardinal/token-manager/dist/cjs/programs/claimApprover/pda'
import { TokenData } from 'api/api'
import {
  PAYMENT_MINTS,
  usePaymentMints,
  WRAPPED_SOL_MINT,
} from 'providers/PaymentMintsProvider'
import * as splToken from '@solana/spl-token'
import { withWrapSol } from 'api/wrappedSol'
import { withClaimToken } from '@cardinal/token-manager'
import { StyledTag, Tag } from 'common/Tags'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import { DisplayAddress } from '@cardinal/namespaces-components'
import { getMintDecimalAmount } from 'common/units'
import { Select } from 'antd'
import styled from '@emotion/styled'
import { lighten } from 'polished'
import { Colors } from 'config/config'
const { Option } = Select

const handleCopy = (shareUrl: string) => {
  navigator.clipboard.writeText(shareUrl)
  notify({ message: 'Share link copied' })
}

enum OrderCategories {
  RecentlyListed = 'Recently Listed',
  PriceLowToHigh = 'Price: Low to High',
  PriceHighToLow = 'Price: High to Low',
  RateLowToHigh = 'Rate: Low to High',
  RateHighToLow = 'Rate: High to Low',
}

const allOrderCategories = [
  OrderCategories.RecentlyListed,
  OrderCategories.PriceLowToHigh,
  OrderCategories.PriceHighToLow,
  OrderCategories.RateLowToHigh,
  OrderCategories.RateHighToLow,
]

const globalRate = 604800

export const Browse = () => {
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  const wallet = useWallet()

  let { issuedTokens, loaded, refreshIssuedTokens } = useIssuedTokens()
  let [filteredIssuedTokens, setFilteredIssuedTokens] =
    useState<TokenData[]>(issuedTokens)
  const [userPaymentTokenAccount, _setUserPaymentTokenAccount] =
    useState<splToken.AccountInfo | null>(null)
  const { paymentMintInfos } = usePaymentMints()
  const [selectedOrderCategory, setSelectedOrderCategory] =
    useState<OrderCategories>(OrderCategories.PriceLowToHigh)

  const StyledSelect = styled.div`
    .ant-select-selector {
      min-width: 180px;
      border: 1px solid ${lighten(0.3, config.colors.main)} !important;
      background-color: ${lighten(0.1, config.colors.main)} !important;
      color: ${config.colors.secondary} !important;
    }
    .ant-select-arrow {
      color: ${config.colors.secondary} !important;
    }
  `

  useEffect(() => {
    async function filterIssuedTokens() {
      const tokens = []
      for (let token of issuedTokens) {
        if (!token.claimApprover?.pubkey) {
          tokens.push(token)
        } else {
          let [tokenClaimApprover] = await findClaimApproverAddress(
            token.tokenManager?.pubkey!
          )
          if (
            tokenClaimApprover.toString() ===
            token.claimApprover?.pubkey.toString()
          ) {
            tokens.push(token)
          }
        }
      }

      handleOrderCategoryChange(selectedOrderCategory, tokens)
    }

    filterIssuedTokens()
  }, [issuedTokens])

  const handleOrderCategoryChange = (
    value: OrderCategories = selectedOrderCategory,
    tokens: TokenData[] = filteredIssuedTokens
  ) => {
    switch (value) {
      case OrderCategories.RecentlyListed:
        setFilteredIssuedTokens(
          tokens.sort((a, b) => {
            return (
              (a.tokenManager?.parsed.stateChangedAt.toNumber() ?? 0) -
              (b.tokenManager?.parsed.stateChangedAt.toNumber() ?? 0)
            )
          })
        )
        break
      case OrderCategories.PriceLowToHigh:
        setFilteredIssuedTokens(
          tokens.sort((a, b) => {
            return (
              (a.claimApprover?.parsed.paymentAmount.toNumber() ?? 0) -
              (b.claimApprover?.parsed.paymentAmount.toNumber() ?? 0)
            )
          })
        )
        break
      case OrderCategories.PriceHighToLow:
        setFilteredIssuedTokens(
          tokens.sort((a, b) => {
            return (
              (b.claimApprover?.parsed.paymentAmount.toNumber() ?? 0) -
              (a.claimApprover?.parsed.paymentAmount.toNumber() ?? 0)
            )
          })
        )
        break
      case OrderCategories.RateLowToHigh:
        setFilteredIssuedTokens(
          tokens.sort((a, b) => {
            return calculateRateFromTokenData(a) - calculateRateFromTokenData(b)
          })
        )
        break
      case OrderCategories.RateHighToLow:
        setFilteredIssuedTokens(
          tokens.sort((a, b) => {
            return calculateRateFromTokenData(b) - calculateRateFromTokenData(a)
          })
        )
        break
      default:
        break
    }
  }

  const handleClaim = async (tokenData: TokenData) => {
    try {
      // wrap sol if there is payment required
      const transaction = new Transaction()
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
      console.log('Claiming token manager', tokenData)
      await withClaimToken(
        transaction,
        environment.override
          ? new Connection(environment.override)
          : connection,
        asWallet(wallet),
        tokenData.tokenManager?.pubkey!
      )
      await executeTransaction(connection, asWallet(wallet), transaction, {
        confirmOptions: { commitment: 'confirmed', maxRetries: 3 },
        signers: [],
        notificationConfig: {},
      })
      refreshIssuedTokens()
    } catch (e: any) {
      console.log(e)
    }
  }

  const getSymbolFromTokenData = (tokenData: TokenData) => {
    const symbol = PAYMENT_MINTS.find(
      (mint) =>
        mint.mint == tokenData.claimApprover?.parsed?.paymentMint.toString()
    )?.symbol
    if (!symbol || symbol == 'SOL') {
      return '◎'
    } else {
      return symbol
    }
  }

  const getPriceFromTokenData = (tokenData: TokenData) => {
    if (tokenData.claimApprover?.parsed) {
      return getMintDecimalAmount(
        paymentMintInfos[
          tokenData.claimApprover?.parsed?.paymentMint.toString()
        ]!,
        tokenData.claimApprover?.parsed?.paymentAmount
      ).toNumber()
    } else {
      return 0
    }
  }

  const calculateRateFromTokenData = (
    tokenData: TokenData,
    rate: number = globalRate
  ) => {
    const price = getPriceFromTokenData(tokenData)
    if (price == 0) return 0
    let duration = 0
    if (tokenData.timeInvalidator?.parsed.durationSeconds) {
      duration = tokenData.timeInvalidator.parsed.durationSeconds.toNumber()
    }
    if (tokenData.timeInvalidator?.parsed.expiration) {
      duration =
        tokenData.timeInvalidator.parsed.expiration.toNumber() -
        Date.now() / 1000
    }
    return (price / duration) * rate
  }

  const calculateFloorPrice = (tokenDatas: TokenData[]): number => {
    const rentalPrices = tokenDatas
      .filter((tokenData) => tokenData.timeInvalidator?.parsed)
      .map((tokenData) => {
        let price = 0,
          duration = 0

        if (tokenData.timeInvalidator?.parsed) {
          if (
            tokenData.claimApprover?.parsed?.paymentMint &&
            paymentMintInfos &&
            paymentMintInfos[
              tokenData.claimApprover?.parsed?.paymentMint.toString()
            ]
          ) {
            price = getPriceFromTokenData(tokenData)
          }
          if (tokenData.timeInvalidator.parsed.durationSeconds) {
            duration =
              tokenData.timeInvalidator.parsed.durationSeconds.toNumber()
          }
          if (tokenData.timeInvalidator.parsed.expiration) {
            duration =
              tokenData.timeInvalidator.parsed.expiration.toNumber() -
              Date.now() / 1000
          }
        }
        return (price / duration) * globalRate
      })
    if (rentalPrices.length == 0) return 0
    return Math.min(...rentalPrices)
  }

  return (
    <div>
      <div className="d-block mx-auto">
        <div className="flex justify-center">
          <div className="d-block flex-col  border-r-2 border-gray-400 py-3 px-5">
            <p className="text-gray-400">FLOOR PRICE / WEEK</p>
            <h2 className="text-center font-bold text-gray-100">
              {calculateFloorPrice(filteredIssuedTokens).toFixed(2)}{' '}
              {filteredIssuedTokens.length > 0
                ? getSymbolFromTokenData(filteredIssuedTokens[0]!)
                : '◎'}
            </h2>
          </div>
          <div className="d-block flex-col  py-3 px-5">
            <p className="text-gray-400">TOTAL LISTED</p>
            <h2 className="text-center font-bold text-gray-100">
              {filteredIssuedTokens.length}
            </h2>
          </div>
        </div>
      </div>
      <div className="flex max-w-[940px] flex-row-reverse">
        <StyledSelect>
          <Select
            className="m-[10px] w-max rounded-[4px] bg-black text-gray-700"
            onChange={(e) => {
              setSelectedOrderCategory(e)
              handleOrderCategoryChange(e)
            }}
            defaultValue={selectedOrderCategory}
          >
            {allOrderCategories.map((category) => (
              <Option key={category} value={category}>
                {category}
              </Option>
            ))}
          </Select>
        </StyledSelect>
      </div>
      <TokensOuter>
        {filteredIssuedTokens && filteredIssuedTokens.length > 0 ? (
          filteredIssuedTokens.map((tokenData) => (
            <div
              key={tokenData.tokenManager?.pubkey.toString()}
              style={{
                paddingTop: '10px',
                display: 'flex',
                gap: '10px',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <>
                <NFT
                  key={tokenData?.tokenManager?.pubkey.toBase58()}
                  tokenData={tokenData}
                  hideQRCode={true}
                ></NFT>
                {
                  {
                    [TokenManagerState.Initialized]: <>Initiliazed</>,
                    [TokenManagerState.Issued]: (
                      <div className="flex w-full justify-between">
                        <StyledTag>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              width: '100%',
                            }}
                          >
                            <Tag
                              state={TokenManagerState.Issued}
                              color="warning"
                            >
                              <div className="float-left">
                                <p className="float-left inline-block">
                                  {new Date(
                                    Number(
                                      tokenData.tokenManager?.parsed.stateChangedAt.toString()
                                    ) * 1000
                                  ).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'numeric',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </p>
                                <br />{' '}
                                <DisplayAddress
                                  connection={connection}
                                  address={
                                    tokenData.tokenManager?.parsed.issuer ||
                                    undefined
                                  }
                                  height="12px"
                                  width="100px"
                                  dark={true}
                                />{' '}
                              </div>
                            </Tag>
                          </div>
                        </StyledTag>
                        <div className="flex w-max">
                          <AsyncButton
                            bgColor={config.colors.secondary}
                            variant="primary"
                            className="mr-1 inline-block flex-none"
                            handleClick={() => handleClaim(tokenData)}
                          >
                            <>
                              Claim{' '}
                              {(tokenData.claimApprover?.parsed?.paymentAmount.toNumber() ??
                                0) / 1000000000}{' '}
                              {getSymbolFromTokenData(tokenData)}{' '}
                            </>
                          </AsyncButton>
                          <Button
                            variant="tertiary"
                            className="mr-1 inline-block flex-none"
                            onClick={() =>
                              handleCopy(
                                getLink(
                                  `/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
                                )
                              )
                            }
                          >
                            <FaLink />
                          </Button>
                        </div>
                      </div>
                    ),
                    [TokenManagerState.Claimed]: (
                      <StyledTag>
                        <Tag state={TokenManagerState.Claimed}>
                          Claimed by{' '}
                          {shortPubKey(
                            tokenData.recipientTokenAccount?.owner || ''
                          )}{' '}
                          {/* {shortDateString(
                          tokenData.tokenManager?.parsed.claimedAt
                        )} */}
                        </Tag>
                        {((wallet.publicKey &&
                          tokenData?.tokenManager?.parsed.invalidators &&
                          tokenData?.tokenManager?.parsed.invalidators
                            .map((i: PublicKey) => i.toString())
                            .includes(wallet.publicKey?.toString())) ||
                          (tokenData.timeInvalidator &&
                            tokenData.timeInvalidator.parsed.expiration &&
                            tokenData.timeInvalidator.parsed.expiration.lte(
                              new BN(Date.now() / 1000)
                            )) ||
                          (tokenData.useInvalidator &&
                            tokenData.useInvalidator.parsed.maxUsages &&
                            tokenData.useInvalidator.parsed.usages.gte(
                              tokenData.useInvalidator.parsed.maxUsages
                            ))) && (
                          <Button
                            variant="primary"
                            disabled={!wallet.connected}
                            onClick={async () => {
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
                                    callback: refreshIssuedTokens,
                                    silent: true,
                                  }
                                )
                            }}
                          >
                            Revoke
                          </Button>
                        )}
                      </StyledTag>
                    ),
                    [TokenManagerState.Invalidated]: (
                      <Tag state={TokenManagerState.Invalidated}>
                        Invalidated
                        {/* {shortDateString(
                    tokenData.tokenManager?.parsed.claimedAt
                  )} */}
                      </Tag>
                    ),
                  }[tokenData?.tokenManager?.parsed.state as TokenManagerState]
                }
              </>
            </div>
          ))
        ) : loaded ? (
          <div className="white flex w-full flex-col items-center justify-center gap-1">
            <div className="text-white">No outstanding tokens!</div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-center">
            <LoadingSpinner />
          </div>
        )}
      </TokensOuter>
    </div>
  )
}
