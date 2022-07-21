import { capitalizeFirstLetter } from '@cardinal/common'
import type { Keypair } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { Pill } from 'common/Pill'
import { RentalSummary } from 'common/RentalSummary'
import { getQueryParam } from 'common/utils'
import {
  getPriceFromTokenData,
  getPriceOrRentalRate,
  getSymbolFromTokenData,
} from 'components/Browse'
import { useHandleClaimRental } from 'handlers/useHandleClaimRental'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { USE_USER_TOKEN_DATAS_KEY } from 'hooks/useUserTokenData'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useModal } from 'providers/ModalProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'
import { useState } from 'react'
import { useQueryClient } from 'react-query'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'

export const secondsToStringForDisplay = (
  secondsAmount: number | undefined | null,
  config?: {
    defaultString?: string
    delimiter?: string
    groupDelimiter?: string
    capitalizeSuffix?: boolean
    showTrailingZeros?: boolean
    showLeadingZeros?: boolean
    fullSuffix?: boolean
    includes?: {
      suffix: string
      fullSuffix: string
      durationSeconds: number
      mod: number
    }[]
  }
) => {
  const ranges = config?.includes ?? [
    {
      suffix: 'd',
      fullSuffix: 'days',
      durationSeconds: 60 * 60 * 24,
    },
    {
      suffix: 'h',
      fullSuffix: 'hours',
      durationSeconds: 60 * 60,
      mod: 24,
    },
    {
      suffix: 'm',
      fullSuffix: 'minutes',
      durationSeconds: 60,
      mod: 60,
    },
    {
      suffix: 's',
      fullSuffix: 'seconds',
      durationSeconds: 1,
      mod: 60,
    },
  ]

  const getSuffix = (suffix: string, fullSuffix: string, amount: number) => {
    const preferredFullSuffix =
      amount === 1 ? fullSuffix.slice(0, -1) : fullSuffix
    const preferredSuffix = config?.fullSuffix ? preferredFullSuffix : suffix
    return `${
      config?.capitalizeSuffix
        ? capitalizeFirstLetter(preferredSuffix)
        : preferredSuffix
    }`
  }

  if (!secondsAmount || secondsAmount <= 0) {
    return (
      config?.defaultString ??
      (ranges[0]
        ? `0 ${getSuffix(ranges[0].suffix, ranges[0]?.fullSuffix, 0)}`
        : '0 days')
    )
  }

  const rangeAmount = (s: number, mod?: number) =>
    Math.floor(mod ? (secondsAmount / s) % mod : secondsAmount / s)

  const rangeAmounts = ranges.map(({ durationSeconds, mod }) =>
    rangeAmount(durationSeconds, mod)
  )

  const showRange = rangeAmounts.map(
    (rangeAmount, i) =>
      rangeAmount > 0 ||
      (config?.showTrailingZeros &&
        rangeAmounts.slice(i).reduce((t, v) => t + v, 0) > 0) ||
      (config?.showLeadingZeros &&
        rangeAmounts.slice(0, i - 1).reduce((t, v) => t + v, 0) > 0)
  )

  return ranges.map(({ durationSeconds, fullSuffix, suffix, mod }, i) => {
    if (!showRange[i]) return ''
    return `${rangeAmount(durationSeconds, mod)}${
      config?.delimiter ?? ''
    }${getSuffix(suffix, fullSuffix, rangeAmount(durationSeconds, mod))}${
      config?.groupDelimiter ?? ' '
    }`
  })
}

export type RentalFixedCardParams = {
  tokenData: TokenData
  otpKeypair?: Keypair
}

export const RentalFixedCard = ({
  tokenData,
  otpKeypair,
}: RentalFixedCardParams) => {
  const [error, setError] = useState<string>()
  const [txid, setTxid] = useState<string>()
  const queryClient = useQueryClient()
  const handleClaimRental = useHandleClaimRental()
  const paymentMints = usePaymentMints()
  const { environment } = useEnvironmentCtx()
  const { config } = useProjectConfig()
  const { UTCNow } = useUTCNow()
  const { durationSeconds } = tokenData.timeInvalidator?.parsed || {}

  return (
    <div className="rounded-lg bg-dark-6 p-8">
      <div className="text-center text-2xl text-light-0">
        Rent {tokenData.metadata?.data.name}
      </div>
      <div className="mb-4 text-center text-lg text-medium-4">
        {config.displayName}
      </div>
      <div
        className={`mb-4 flex w-full justify-center gap-4 overflow-x-auto pb-6`}
      >
        <div className="relative w-3/4 lg:w-1/2">
          {tokenData.metadata && tokenData.metadata.data && (
            <img
              className="rounded-lg"
              src={
                getQueryParam(tokenData.metadata?.data?.image, 'uri') ||
                tokenData.metadata.data.image
              }
              alt={tokenData.metadata.data.name}
            />
          )}
          <Pill className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 border-[1px] border-border text-secondary">
            Fixed duration
          </Pill>
        </div>
      </div>
      {durationSeconds && (
        <div className="mb-8 px-8 text-center text-base text-medium-3">
          This NFT can be rented for a specified duration of{' '}
          {secondsToStringForDisplay(durationSeconds?.toNumber() ?? 0, {
            fullSuffix: true,
            delimiter: ' ',
            showTrailingZeros: false,
          })}
        </div>
      )}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-4">
          <div>
            <div className="mb-1 text-base text-light-0">Rental duration</div>
            <div className="text-base text-medium-3">
              {secondsToStringForDisplay(durationSeconds?.toNumber() ?? 0, {
                fullSuffix: true,
                delimiter: ' ',
                showTrailingZeros: false,
              })}
            </div>
          </div>
          <div>
            <div className="mb-1 text-base text-light-0">Fixed price</div>
            <div className="text-base text-medium-3">
              {getPriceFromTokenData(tokenData, paymentMints.data)}
              {getSymbolFromTokenData(tokenData)} ={' '}
              {getPriceOrRentalRate(
                config,
                tokenData,
                paymentMints.data
              ).toFixed(4)}
              {getSymbolFromTokenData(tokenData)} /{' '}
              {capitalizeFirstLetter(config.marketplaceRate ?? 'days').slice(
                0,
                -1
              )}
            </div>
          </div>
        </div>
        <RentalSummary tokenData={tokenData} />
        {txid && (
          <Alert variant="success">
            Congratulations! You have succesfully claimed your rental with
            transaction shown{' '}
            <a
              className="text-blue-500"
              href={`https://explorer.solana.com/tx/${txid}?cluster=${
                environment.label?.toString() ?? ''
              }`}
              target="_blank"
              rel="noopener noreferrer"
            >
              here
            </a>
          </Alert>
        )}
        {error && (
          <Alert variant="error" showClose onClick={() => setError(undefined)}>
            {error}
          </Alert>
        )}
        <Button
          variant="primary"
          className="h-12"
          onClick={() =>
            handleClaimRental.mutate(
              {
                tokenData,
                otpKeypair,
              },
              {
                onSuccess: (txid) => {
                  setTxid(txid)
                  queryClient.invalidateQueries(USE_USER_TOKEN_DATAS_KEY)
                  queryClient.invalidateQueries(USE_USER_TOKEN_DATAS_KEY)
                },
                onError: (e) => {
                  setTxid(undefined)
                  setError(`${e}`)
                },
              }
            )
          }
        >
          {handleClaimRental.isLoading ? (
            <LoadingSpinner height="25px" />
          ) : (
            <div
              style={{ gap: '5px' }}
              className="flex items-center justify-center text-base"
            >
              Rent NFT
            </div>
          )}
        </Button>
      </div>
      <PoweredByFooter />
    </div>
  )
}

export const useRentalFixedModal = () => {
  const { showModal } = useModal()
  return {
    showRentalFixedModal: (params: RentalFixedCardParams) =>
      showModal(<RentalFixedCard {...params} />),
  }
}
