import { BN } from '@project-serum/anchor'
import type { Wallet } from '@saberhq/solana-contrib'
import type { Connection, Keypair } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { DurationInput } from 'common/DurationInput'
import { getQueryParam } from 'common/utils'
import type { ProjectConfig } from 'config/config'
import { useHandleRateRental } from 'handlers/useHandleRateRental'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
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
  const { environment } = useEnvironmentCtx()

  const {
    extensionPaymentAmount,
    extensionPaymentMint,
    durationSeconds,
    extensionDurationSeconds,
    maxExpiration,
  } = tokenData.timeInvalidator?.parsed || {}

  const [paymentAmount, setPaymentAmount] = useState(new BN(0))
  const [currentExtensionSeconds, setCurrentExtensionSeconds] = useState<
    number | undefined | null
  >(0)
  // const userPaymentTokenAccount = useUserPaymentTokenAccount(
  //   tokenData?.timeInvalidator?.parsed.extensionPaymentMint ?? undefined
  // )

  useEffect(() => {
    currentExtensionSeconds !== null &&
      currentExtensionSeconds !== undefined &&
      setPaymentAmount(
        (extensionPaymentAmount ?? new BN(0))
          .mul(new BN(currentExtensionSeconds))
          .div(extensionDurationSeconds ?? new BN(1))
      )
  }, [
    extensionPaymentAmount?.toNumber(),
    extensionDurationSeconds,
    currentExtensionSeconds,
  ])

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
        Rent {tokenData.metadata?.data.name}
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
        <div className="flex gap-4">
          <div>
            <div className="mb-1 text-base text-light-0">Rental duration</div>
            <DurationInput
              defaultAmount={0}
              handleChange={(v) => setCurrentExtensionSeconds(v)}
            />
          </div>
          <div>
            <div className="mb-1 text-base text-light-0">Price</div>
            <MintPriceSelector
              price={paymentAmount}
              defaultPrice={paymentAmount}
              defaultMint={extensionPaymentMint?.toString()}
              paymentMintData={PAYMENT_MINTS}
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
          disabled={
            exceedMaxExpiration() ||
            (paymentAmount.isZero() && extensionPaymentAmount.toNumber() !== 0)
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
