import type { Wallet } from '@saberhq/solana-contrib'
import type { Connection, Keypair } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { DurationInput } from 'common/DurationInput'
import { getQueryParam } from 'common/utils'
import type { ProjectConfig } from 'config/config'
import { useHandleRateRental } from 'handlers/useHandleRateRental'
import { useEffect, useState } from 'react'
import { FiSend } from 'react-icons/fi'
import { PAYMENT_MINTS } from 'rental-components/common/Constants'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { MintPriceSelector } from 'rental-components/common/MintPriceSelector'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'

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
  const [currentExtensionSeconds, setCurrentExtensionSeconds] = useState<
    number | undefined | null
  >(0)
  // const userPaymentTokenAccount = useUserPaymentTokenAccount(
  //   tokenData?.timeInvalidator?.parsed.extensionPaymentMint ?? undefined
  // )

  console.log(currentExtensionSeconds)

  useEffect(() => {
    currentExtensionSeconds &&
      setPaymentAmount(
        ((extensionPaymentAmount?.toNumber() ?? 0) /
          (extensionDurationSeconds?.toNumber() ?? 0)) *
          currentExtensionSeconds
      )
  }, [
    extensionPaymentAmount,
    extensionDurationSeconds,
    currentExtensionSeconds,
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
            <DurationInput
              handleChange={(v) => setCurrentExtensionSeconds(v)}
            />
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
