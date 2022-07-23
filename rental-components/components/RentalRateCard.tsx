import { capitalizeFirstLetter } from '@cardinal/common'
import type { Keypair } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { DurationInput } from 'common/DurationInput'
import { Pill } from 'common/Pill'
import { RentalSummary } from 'common/RentalSummary'
import { getQueryParam } from 'common/utils'
import { getPriceOrRentalRate, getSymbolFromTokenData } from 'components/Browse'
import { useHandleRateRental } from 'handlers/useHandleRateRental'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useModal } from 'providers/ModalProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'
import { FiSend } from 'react-icons/fi'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'

import { RentalSuccessCard } from './RentalSuccessCard'

export type RentalRateCardProps = {
  claim?: boolean
  tokenData: TokenData
  otpKeypair?: Keypair
}

export const RentalRateCard = ({
  tokenData,
  otpKeypair,
  claim = true,
}: RentalRateCardProps) => {
  const [error, setError] = useState<string>()
  const [txid, setTxid] = useState<string>()
  const handleRateRental = useHandleRateRental()
  const { environment } = useEnvironmentCtx()
  const { config } = useProjectConfig()
  const paymentMints = usePaymentMints()

  const {
    extensionPaymentAmount,
    extensionPaymentMint,
    durationSeconds,
    maxExpiration,
  } = tokenData.timeInvalidator?.parsed || {}

  const [currentExtensionSeconds, setCurrentExtensionSeconds] = useState(0)

  if (!extensionPaymentAmount || !extensionPaymentMint || !durationSeconds) {
    return <>Incorrect extension parameters</>
  }

  const exceedMaxExpiration = () => {
    return !!(
      tokenData.tokenManager &&
      currentExtensionSeconds &&
      maxExpiration &&
      maxExpiration.toNumber() <
        tokenData.tokenManager.parsed.stateChangedAt.toNumber() +
          durationSeconds.toNumber() +
          currentExtensionSeconds
    )
  }

  if (txid)
    return (
      <RentalSuccessCard
        tokenData={tokenData}
        extensionSeconds={currentExtensionSeconds}
        txid={txid}
      />
    )
  return (
    <div className="rounded-lg bg-dark-6 p-6">
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
          <Pill className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 border-[1px] border-border text-primary">
            Rate rental
          </Pill>
        </div>
      </div>
      <p className="mb-2 flex flex-col gap-4 text-center text-[16px] text-gray-800">
        <span className="mb-2 text-[13px] text-gray-500">
          This NFT can be rented for a specified duration<br></br>
          <b>Max rental duration:&nbsp;</b>{' '}
          {maxExpiration
            ? `${new Date(maxExpiration?.toNumber() * 1000).toLocaleString(
                'en-US',
                {
                  year: '2-digit',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: undefined,
                }
              )}
              `
            : 'N/A'}{' '}
          (Local time)
        </span>
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-4">
          <div>
            <div className="mb-1 text-base text-light-0">Rental duration</div>
            <DurationInput
              defaultAmount={0}
              handleChange={(v) => setCurrentExtensionSeconds(v)}
            />
          </div>
          <div>
            <div className="mb-3 text-base text-light-0">Rental rate</div>
            <div className="text-base text-medium-3">
              {getPriceOrRentalRate(
                config,
                tokenData,
                paymentMints.data
              ).toFixed(4)}{' '}
              {getSymbolFromTokenData(tokenData)} /{' '}
              {capitalizeFirstLetter(config.marketplaceRate ?? 'days').slice(
                0,
                -1
              )}
            </div>
          </div>
        </div>
        <RentalSummary
          tokenData={tokenData}
          extensionSeconds={currentExtensionSeconds}
        />
        {exceedMaxExpiration() && (
          <Alert variant="error">Extension amount exceeds max expiration</Alert>
        )}
        {txid && (
          <Alert variant="success">
            Congratulations! You have succesfully{' '}
            {claim ? 'claimed ' : 'extended '}your rental with transaction shown{' '}
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
          disabled={exceedMaxExpiration()}
          onClick={() =>
            handleRateRental.mutate(
              {
                tokenData: {
                  tokenManager: tokenData.tokenManager,
                  timeInvalidator: tokenData.timeInvalidator,
                },
                extensionSeconds: currentExtensionSeconds,
                claim,
                otpKeypair,
              },
              {
                onSuccess: (txid) => {
                  setTxid(txid)
                },
                onError: (e) => {
                  setTxid(undefined)
                  setError(`${e}`)
                },
              }
            )
          }
        >
          {handleRateRental.isLoading ? (
            <LoadingSpinner height="25px" />
          ) : (
            <div
              style={{ gap: '5px' }}
              className="flex items-center justify-center text-base"
            >
              {claim ? 'Rent NFT' : 'Extend Rental'}
              <FiSend />
            </div>
          )}
        </Button>
      </div>
      <PoweredByFooter />
    </div>
  )
}

export const useRentalRateCard = () => {
  const { showModal } = useModal()
  return {
    showModal: (params: RentalRateCardProps) =>
      showModal(<RentalRateCard {...params} />),
  }
}
