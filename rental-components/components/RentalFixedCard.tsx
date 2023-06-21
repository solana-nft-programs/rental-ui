import { InvalidationType } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { Keypair } from '@solana/web3.js'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { LoadingSpinner } from 'common/LoadingSpinner'
import { getRentalRateDisplayText } from 'common/NFTIssuerInfo'
import { RentalSummary, secondsToStringForDisplay } from 'common/RentalSummary'
import { Toggle } from 'common/Toggle'
import { Tooltip } from 'common/Tooltip'
import type { TokenData } from 'data/data'
import { useHandleClaimRental } from 'handlers/useHandleClaimRental'
import { useHandleUpdateInvalidationType } from 'handlers/useHandleUpdateInvalidationType'
import { useManagedTokens } from 'hooks/useManagedTokens'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useWalletId } from 'hooks/useWalletId'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useModal } from 'providers/ModalProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'
import { RentalClaimCardTokenHeader } from 'rental-components/common/RentalCardTokenHeader'

import { RentalSuccessCard } from './RentalSuccessCard'

export type RentalFixedCardParams = {
  tokenData: TokenData
  otpKeypair?: Keypair
}

export const RentalFixedText = ({ tokenData }: { tokenData: TokenData }) => {
  const { durationSeconds } = tokenData.timeInvalidator?.parsed || {}
  if (!durationSeconds) return <></>
  return (
    <div className="mb-8 px-8 text-center text-base text-medium-3">
      This NFT can be rented for a fixed duration of{' '}
      {secondsToStringForDisplay(durationSeconds?.toNumber() ?? 0, {
        fullSuffix: true,
        delimiter: ' ',
        showTrailingZeros: false,
      })}
    </div>
  )
}

export const RentalFixedInfo = ({ tokenData }: { tokenData: TokenData }) => {
  const walletId = useWalletId()
  const { onDismiss } = useModal()
  const paymentMints = usePaymentMints()
  const managedTokens = useManagedTokens()
  const { configFromToken } = useProjectConfig()
  const config = configFromToken(tokenData)
  const { durationSeconds } = tokenData.timeInvalidator?.parsed || {}
  const handleUpdateInvalidationType = useHandleUpdateInvalidationType()

  const canEdit =
    walletId?.toString() === tokenData.tokenManager?.parsed.issuer.toString()

  return (
    <div className="flex justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="mb-1 text-base text-light-0">Rental duration</div>
        <div className="text-base text-medium-3">
          {secondsToStringForDisplay(durationSeconds?.toNumber() ?? 0, {
            fullSuffix: true,
            delimiter: ' ',
            showTrailingZeros: false,
          })}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="mb-1 text-base text-light-0">Fixed price</div>
        <div className="text-base text-medium-3">
          {getRentalRateDisplayText(
            config,
            tokenData,
            paymentMints.data,
            'text-medium-3'
          )}
        </div>
      </div>
      {canEdit &&
        (tokenData.tokenManager?.parsed.invalidationType ===
          InvalidationType.Reissue ||
          tokenData.tokenManager?.parsed.invalidationType ===
            InvalidationType.Return) && (
          <div className="flex flex-col gap-1">
            <Tooltip
              title={
                tokenData.tokenManager?.parsed.invalidationType ===
                InvalidationType.Reissue
                  ? 'After the rental expiration this NFT will be automatically relisted on the marketplace.'
                  : 'Upon the rental expiration this NFT will be securely returned into your wallet.'
              }
            >
              <div className="mb-2 flex items-center gap-2 text-light-0">
                Relisting
              </div>
            </Tooltip>
            {handleUpdateInvalidationType.isLoading ? (
              <div className="h-[25px] w-full animate-pulse rounded-md bg-border" />
            ) : (
              <div className="flex text-medium-3">
                <Toggle
                  defaultValue={
                    tokenData.tokenManager?.parsed.invalidationType ===
                    InvalidationType.Reissue
                  }
                  onChange={() =>
                    handleUpdateInvalidationType.mutate(
                      {
                        tokenData: tokenData,
                        newInvalidationType:
                          tokenData.tokenManager?.parsed.invalidationType ===
                          InvalidationType.Return
                            ? InvalidationType.Reissue
                            : InvalidationType.Return,
                      },
                      {
                        onSuccess: () => {
                          managedTokens.refetch()
                          onDismiss()
                        },
                      }
                    )
                  }
                ></Toggle>
              </div>
            )}
          </div>
        )}
    </div>
  )
}

export const RentalFixedCard = ({
  tokenData,
  otpKeypair,
}: RentalFixedCardParams) => {
  const [error, setError] = useState<string>()
  const [txid, setTxid] = useState<string>()
  const handleClaimRental = useHandleClaimRental()
  const { environment } = useEnvironmentCtx()

  if (txid) return <RentalSuccessCard tokenData={tokenData} txid={txid} />
  return (
    <div className="rounded-lg bg-dark-6 p-8">
      <RentalClaimCardTokenHeader tokenData={tokenData} />
      <RentalFixedText tokenData={tokenData} />
      <div className="flex flex-col gap-4">
        <RentalFixedInfo tokenData={tokenData} />
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
                rentalType: 'duration',
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
export const useRentalFixedCard = () => {
  const { showModal } = useModal()
  return {
    showModal: (params: RentalFixedCardParams) =>
      showModal(<RentalFixedCard {...params} />),
  }
}
