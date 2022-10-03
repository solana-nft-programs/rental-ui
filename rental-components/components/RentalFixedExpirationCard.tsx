import { capitalizeFirstLetter } from '@cardinal/common'
import type { Keypair } from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { RentalSummary } from 'common/RentalSummary'
import {
  getPriceFromTokenData,
  getPriceOrRentalRate,
  getSymbolFromTokenData,
  invalidationTypeInfo,
} from 'common/tokenDataUtils'
import { useHandleClaimRental } from 'handlers/useHandleClaimRental'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useModal } from 'providers/ModalProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'
import { RentalClaimCardTokenHeader } from 'rental-components/common/RentalCardTokenHeader'

import { RentalSuccessCard } from './RentalSuccessCard'

export type RentalFixedExpirationParams = {
  tokenData: TokenData
  otpKeypair?: Keypair
}

export const RentalFixedExpirationText = ({
  tokenData,
}: {
  tokenData: TokenData
}) => {
  const { maxExpiration } = tokenData.timeInvalidator?.parsed || {}
  const invalidationType = invalidationTypeInfo(
    tokenData.tokenManager?.parsed.invalidationType
  )
  if (!maxExpiration) return <></>
  return (
    <div className="mb-8 px-8 text-center text-base text-medium-3">
      You can {invalidationType.claimText?.toLowerCase()} this NFT and it will
      be locked in your wallet until{' '}
      {new Date(maxExpiration.toNumber() * 1000).toLocaleString('en-US')}
    </div>
  )
}

export const RentalFixedExpirationInfo = ({
  tokenData,
}: {
  tokenData: TokenData
}) => {
  const paymentMints = usePaymentMints()
  const { configFromToken } = useProjectConfig()
  const config = configFromToken(tokenData)
  const { maxExpiration } = tokenData.timeInvalidator?.parsed || {}
  return (
    <div className="flex justify-between gap-4">
      <div>
        <div className="mb-1 text-base text-light-0">Expiration</div>
        <div className="text-base text-medium-3">
          {maxExpiration &&
            new Date(maxExpiration.toNumber() * 1000).toLocaleString('en-US')}
        </div>
      </div>
      <div>
        <div className="mb-1 text-base text-light-0">Fixed price</div>
        <div className="text-base text-medium-3">
          {getPriceFromTokenData(tokenData, paymentMints.data)}{' '}
          {getSymbolFromTokenData(tokenData)} ={' '}
          {getPriceOrRentalRate(config, tokenData, paymentMints.data).toFixed(
            4
          )}{' '}
          {getSymbolFromTokenData(tokenData)} /{' '}
          {capitalizeFirstLetter(config.marketplaceRate ?? 'days').slice(0, -1)}
        </div>
      </div>
    </div>
  )
}

export const RentalFixedExpirationCard = ({
  tokenData,
  otpKeypair,
}: RentalFixedExpirationParams) => {
  const [error, setError] = useState<string>()
  const [txid, setTxid] = useState<string>()
  const handleClaimRental = useHandleClaimRental()
  const { environment } = useEnvironmentCtx()
  const invalidationType = invalidationTypeInfo(
    tokenData.tokenManager?.parsed.invalidationType
  )

  if (txid) return <RentalSuccessCard tokenData={tokenData} txid={txid} />
  return (
    <div className="rounded-lg bg-dark-6 p-8">
      <RentalClaimCardTokenHeader tokenData={tokenData} />
      <RentalFixedExpirationText tokenData={tokenData} />
      <div className="flex flex-col gap-4">
        <RentalFixedExpirationInfo tokenData={tokenData} />
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
                rentalType: 'expiration',
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
              {invalidationType.claimText} NFT
            </div>
          )}
        </Button>
      </div>
      <PoweredByFooter />
    </div>
  )
}
export const useRentalFixedExpirationCard = () => {
  const { showModal } = useModal()
  return {
    showModal: (params: RentalFixedExpirationParams) =>
      showModal(<RentalFixedExpirationCard {...params} />),
  }
}
