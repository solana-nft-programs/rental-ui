import { css } from '@emotion/react'
import type { Wallet } from '@saberhq/solana-contrib'
import type { Connection, Keypair } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { Selector } from 'common/Selector'
import { capitalizeFirstLetter, getQueryParam } from 'common/utils'
import type { ProjectConfig } from 'config/config'
import { useHandleRateRental } from 'handlers/useHandleRateRental'
import { useEffect, useState } from 'react'
import { AiOutlineMinus, AiOutlinePlus } from 'react-icons/ai'
import { FiSend } from 'react-icons/fi'
import { PAYMENT_MINTS } from 'rental-components/common/Constants'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { MintPriceSelector } from 'rental-components/common/MintPriceSelector'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'

import type { DurationOption } from './RentalCard'
import { DURATION_DATA, SECONDS_TO_DURATION } from './RentalCard'

export type RentalRateCardProps = {
  claim?: boolean
  cluster?: string
  connection: Connection
  wallet: Wallet
  tokenData: TokenData
  config?: ProjectConfig
  appName?: string
  appTwitter?: string
  otpKeypair?: Keypair
  notify?: () => void
  onComplete?: (asrg0: string) => void
}

export const RentalRateCard = ({
  appName,
  connection,
  wallet,
  tokenData,
  claim = true,
  otpKeypair,
}: RentalRateCardProps) => {
  const [error, setError] = useState<string>()
  const [txid, setTxid] = useState<string>()
  const handleRateRental = useHandleRateRental()

  // form
  const {
    extensionPaymentAmount,
    extensionPaymentMint,
    durationSeconds,
    extensionDurationSeconds,
    maxExpiration,
  } = tokenData.timeInvalidator?.parsed || {}

  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [durationAmount, setDurationAmount] = useState<number>(1)
  const [durationOption, setDurationOption] = useState<DurationOption>(
    SECONDS_TO_DURATION[
      extensionDurationSeconds?.toNumber() ?? 86400
    ] as DurationOption
  )
  const [currentExtensionSeconds, setCurrentExtensionSeconds] = useState<
    number | undefined | null
  >(0)
  // const userPaymentTokenAccount = useUserPaymentTokenAccount(
  //   tokenData?.timeInvalidator?.parsed.extensionPaymentMint ?? undefined
  // )

  useEffect(() => {
    const newDuration = durationAmount * DURATION_DATA[durationOption]
    setCurrentExtensionSeconds(newDuration)
    setPaymentAmount(
      ((extensionPaymentAmount?.toNumber() ?? 0) /
        (extensionDurationSeconds?.toNumber() ?? 0)) *
        newDuration
    )
  }, [
    durationAmount,
    durationOption,
    extensionPaymentAmount,
    extensionDurationSeconds,
  ])

  const handlePaymentAmountChange = (value: number) => {
    setPaymentAmount(value)
    const extensionSeconds = paymentAmountToSeconds(value)
    setCurrentExtensionSeconds(extensionSeconds)
  }

  const paymentAmountToSeconds = (paymentAmount: number) => {
    return (
      extensionDurationSeconds &&
      extensionPaymentAmount &&
      (extensionDurationSeconds.toNumber() /
        extensionPaymentAmount.toNumber()) *
        paymentAmount
    )
  }

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

  return (
    <div className="rounded-lg bg-dark-6 p-6">
      <div className="text-center text-xl text-light-0">
        Rent out {tokenData.metadata?.data.name}
      </div>
      <div
        className={`flex w-full justify-center gap-4 overflow-scroll overflow-x-auto py-4`}
      >
        <div className="w-1/2 flex-shrink-0 overflow-hidden rounded-lg bg-medium-4">
          {tokenData.metadata && tokenData.metadata.data && (
            <img
              src={
                getQueryParam(tokenData.metadata?.data?.image, 'uri') ||
                tokenData.metadata.data.image
              }
              alt={tokenData.metadata.data.name}
            />
          )}
        </div>
      </div>
      <p className="mb-2 flex flex-col gap-4 text-center text-[16px] text-gray-800">
        <span className="mb-2 text-[13px] text-gray-500">
          <b>Max Rental Duration:&nbsp;</b>{' '}
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
            : 'N/A'}
        </span>
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex gap-6">
          <div>
            <div className="mb-1 text-light-0">Rental duration</div>
            <div className="flex gap-1">
              <div className="relative flex">
                <input
                  className="w-full rounded-md border border-border bg-dark-4 py-2 px-3 text-light-0 placeholder-medium-3 outline-none transition-all focus:border-primary"
                  type="text"
                  inputMode="numeric"
                  css={css`
                    line-height: 20px;
                  `}
                  placeholder="# of..."
                  min="0"
                  step={1}
                  value={`${durationAmount}`}
                  onChange={(e) =>
                    setDurationAmount(parseInt(e.target.value) || 0)
                  }
                />
                <div className="absolute right-3 top-1/2 flex -translate-y-1/2 transform items-center justify-center gap-1">
                  <button
                    onClick={() =>
                      setDurationAmount(Math.max(0, durationAmount - 1))
                    }
                  >
                    <AiOutlineMinus
                      className="opacity-50 hover:opacity-100"
                      style={{ height: '16px', width: '16px' }}
                    />
                  </button>
                  <button
                    onClick={() =>
                      setDurationAmount(Math.max(0, durationAmount + 1))
                    }
                  >
                    <AiOutlinePlus
                      className="opacity-50 hover:opacity-100"
                      style={{ height: '16px', width: '16px' }}
                    />
                  </button>
                </div>
              </div>
              <Selector<DurationOption>
                className="w-max rounded-[4px]"
                onChange={(e) => setDurationOption(e.value)}
                defaultOption={{
                  value: durationOption,
                  label: capitalizeFirstLetter(durationOption).substring(
                    0,
                    durationOption.length - 1
                  ),
                }}
                options={Object.keys(DURATION_DATA).map((option) => ({
                  label: capitalizeFirstLetter(option).substring(
                    0,
                    option.length - 1
                  ),
                  value: option as DurationOption,
                }))}
              />
            </div>
          </div>
          <div>
            <div className="mb-1 text-light-0">Rental rate</div>
            <MintPriceSelector
              price={paymentAmount}
              handlePrice={handlePaymentAmountChange}
              paymentMintData={PAYMENT_MINTS}
              mint={extensionPaymentMint?.toString()}
              handleMint={() => {}}
              disabled={true}
              mintDisabled={true}
            />
          </div>
        </div>
        {/* <div className="mx-auto -mt-3 w-1/2">
            <p className="ml-3 mt-2 text-[14px] text-gray-800">
              <span className="font-bold">Duration of Rental: </span>
              {`${secondsToString(currentExtensionSeconds)}
              `}
            </p>
            <p className="ml-3 mt-2 text-[12px] text-gray-800">
              <span className="font-bold ">Max Duration: </span>
              {maxExpiration
                ? `${new Date(maxExpiration?.toNumber() * 1000).toLocaleString(
                    'en-US'
                  )}
              `
                : 'N/A'}
            </p>
          </div> */}
        {exceedMaxExpiration() && (
          <Alert variant="error">Extension amount exceeds max expiration</Alert>
        )}
        {error && (
          <Alert variant="error" showClose onClick={() => setError(undefined)}>
            {error}
          </Alert>
        )}
        <Button
          variant="primary"
          className="h-12"
          disabled={
            exceedMaxExpiration() ||
            (paymentAmount === 0 && extensionPaymentAmount.toNumber() !== 0)
          }
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
              className="flex items-center justify-center"
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
