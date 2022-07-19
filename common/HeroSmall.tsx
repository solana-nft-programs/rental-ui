import { secondsToString } from '@cardinal/common'
import type * as splToken from '@solana/spl-token'
import type { TokenData } from 'api/api'
import { getSymbolFromTokenData } from 'components/Browse'
import type { ProjectConfig } from 'config/config'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useProjectStats } from 'hooks/useProjectStats'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { DURATION_DATA } from 'rental-components/components/RentalCard'

import { Glow } from './Glow'
import { getMintDecimalAmount } from './units'

type Props = {
  tokens?: TokenData[]
}

const getPriceFromTokenData = (
  tokenData: TokenData,
  paymentMints: { [name: string]: splToken.MintInfo } | undefined
): number => {
  if (
    tokenData.claimApprover?.parsed &&
    tokenData.claimApprover?.parsed?.paymentMint.toString() &&
    paymentMints
  ) {
    const mintInfo =
      paymentMints[tokenData.claimApprover?.parsed?.paymentMint.toString()]
    if (mintInfo && mintInfo.decimals !== NaN) {
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

const calculateFloorPrice = (
  tokenDatas: TokenData[],
  config: ProjectConfig,
  paymentMints: { [name: string]: splToken.MintInfo } | undefined
): number => {
  const onlyRateTokens = (tokenData: TokenData) => {
    if (config.marketplaceRate) {
      return (
        tokenData.timeInvalidator?.parsed?.durationSeconds?.toNumber() === 0
      )
    } else {
      return false
    }
  }

  const rentalPrices = tokenDatas
    .filter(
      (tokenData) =>
        tokenData.timeInvalidator?.parsed && onlyRateTokens(tokenData)
    )
    .map((tokenData) => {
      let price = 0
      let duration = 0

      if (paymentMints && tokenData.timeInvalidator?.parsed) {
        if (
          tokenData.timeInvalidator.parsed.durationSeconds?.toNumber() === 0
        ) {
          if (
            tokenData.timeInvalidator.parsed.extensionPaymentAmount &&
            tokenData.timeInvalidator.parsed.extensionDurationSeconds &&
            tokenData.timeInvalidator?.parsed?.extensionPaymentMint &&
            paymentMints
          ) {
            price = getMintDecimalAmount(
              paymentMints[
                tokenData.timeInvalidator?.parsed?.extensionPaymentMint.toString()
              ]!,
              tokenData.timeInvalidator?.parsed?.extensionPaymentAmount
            ).toNumber()
            duration =
              tokenData.timeInvalidator.parsed.extensionDurationSeconds.toNumber()
          }
        } else {
          if (
            tokenData.claimApprover?.parsed?.paymentMint &&
            paymentMints &&
            paymentMints &&
            paymentMints[
              tokenData.claimApprover?.parsed?.paymentMint.toString()
            ]
          ) {
            price = getPriceFromTokenData(tokenData, paymentMints)
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
      }
      return (
        (price / duration) * DURATION_DATA[config.marketplaceRate ?? 'days']
      )
    })
  if (rentalPrices.length === 0) return 0
  return Math.min(...rentalPrices)
}

export const HeroSmall: React.FC<Props> = ({ tokens }: Props) => {
  const { config } = useProjectConfig()
  const projectStats = useProjectStats()
  const paymentMints = usePaymentMints()
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-6 py-8 px-4 lg:justify-between lg:px-20">
      <Glow angle={160}>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-dark-6 bg-opacity-30 p-2">
            <img className="w-full" src={config.logoImage} alt={config.name} />
          </div>
          <div className="text-2xl text-light-0">{config.displayName}</div>
        </div>
      </Glow>
      <div className="flex justify-center">
        <div className="flex flex-col items-center justify-center px-10">
          <div className="text-medium-4">Floor price</div>
          {!tokens || !paymentMints.data ? (
            <div className="h-5 w-10 animate-pulse rounded-md bg-border"></div>
          ) : (
            <div className="text-center text-gray-100">
              {calculateFloorPrice(tokens, config, paymentMints.data).toFixed(
                2
              )}{' '}
              {tokens.length > 0 ? getSymbolFromTokenData(tokens[0]!) : '◎'}{' '}
              {config.marketplaceRate
                ? config.marketplaceRate
                    .substring(0, config.marketplaceRate.length - 1)
                    .toUpperCase()
                : 'day'}
            </div>
          )}
        </div>
        <div className="my-auto h-10 w-[1px] bg-border"></div>
        <div className="flex-col px-10">
          <p className="text-medium-4">Listed</p>
          {!tokens ? (
            <div className="h-5 w-10 animate-pulse rounded-md bg-border"></div>
          ) : (
            <div className="text-center text-gray-100">{tokens.length}</div>
          )}
        </div>

        {projectStats && (
          <>
            {projectStats.data?.totalRentalCount && (
              <>
                <div className="my-auto h-10 w-[1px] bg-border"></div>
                <div className="flex-col px-10">
                  <p className="text-medium-4">Total rentals</p>
                  {!projectStats.data ? (
                    <div className="h-5 w-10 animate-pulse rounded-md bg-border"></div>
                  ) : (
                    <div className="text-center text-gray-100">
                      {projectStats.data?.totalRentalCount}
                    </div>
                  )}
                </div>
              </>
            )}
            {projectStats.data?.totalRentalDuration && (
              <>
                <div className="my-3 w-[1px]"></div>
                <div className="flex-col px-10">
                  <p className="text-medium-4">TOTAL DURATION (ALL-TIME)</p>
                  <div className="text-center text-gray-100">
                    {secondsToString(projectStats.data?.totalRentalDuration)}
                  </div>
                </div>
              </>
            )}
            {projectStats.data?.totalRentalVolume && (
              <>
                <div className="my-3 w-[1px]"></div>
                <div className="flex-col px-10">
                  <p className="text-medium-4">TOTAL VOLUME (ALL-TIME)</p>
                  <div className="text-center text-gray-100">
                    {secondsToString(projectStats.data?.totalRentalVolume)} ◎
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
