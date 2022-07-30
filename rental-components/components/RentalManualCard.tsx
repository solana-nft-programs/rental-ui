import { ProfileSmall } from '@cardinal/namespaces-components'
import type { Keypair } from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { Pill } from 'common/Pill'
import { getQueryParam } from 'common/utils'
import { useHandleClaimRental } from 'handlers/useHandleClaimRental'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useModal } from 'providers/ModalProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'

import { RentalSuccessCard } from './RentalSuccessCard'

export type RentalManualCardParams = {
  tokenData: TokenData
  otpKeypair?: Keypair
}

export const RentalManualCard = ({
  tokenData,
  otpKeypair,
}: RentalManualCardParams) => {
  const [error, setError] = useState<string>()
  const [txid, setTxid] = useState<string>()
  const handleClaimRental = useHandleClaimRental()
  const { connection } = useEnvironmentCtx()
  const { configFromToken } = useProjectConfig()
  const config = configFromToken(tokenData)

  if (txid) return <RentalSuccessCard tokenData={tokenData} txid={txid} />
  return (
    <div className="rounded-lg bg-dark-6 p-8">
      <div className="text-center text-2xl text-light-0">
        Rent {tokenData.metadata?.data.name}
      </div>
      <div className="mb-2 text-center text-lg text-medium-4">
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
          <Pill className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 border-[1px] border-border text-primary-2">
            Manual
          </Pill>
        </div>
      </div>
      <div className="mb-8 px-8 text-center text-base text-medium-3">
        You may own this NFT asset until a designated owner revokes the rental.
      </div>
      <div className="flex flex-col gap-4">
        <div className="text-base">Manual revocation can be triggered by</div>
        {tokenData.tokenManager?.parsed.invalidators.map((i) => (
          <div key={i.toString()} className="rounded-xl bg-dark-4 px-4 py-2">
            <ProfileSmall connection={connection} address={i} />
          </div>
        ))}
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
export const useRentalManualCard = () => {
  const { showModal } = useModal()
  return {
    showModal: (params: RentalManualCardParams) =>
      showModal(<RentalManualCard {...params} />),
  }
}
