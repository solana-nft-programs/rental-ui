import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { Keypair } from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { RentalSummary } from 'common/RentalSummary'
import { rentalType } from 'common/tokenDataUtils'
import { useWalletId } from 'hooks/useWalletId'
import { useModal } from 'providers/ModalProvider'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'
import { RentalClaimCardTokenHeader } from 'rental-components/common/RentalCardTokenHeader'

import { RentalFixedInfo, RentalFixedText } from './RentalFixedCard'
import {
  RentalFixedExpirationInfo,
  RentalFixedExpirationText,
} from './RentalFixedExpirationCard'
import { RentalManualInfo, RentalManualText } from './RentalManualCard'
import { RentalRateInfo, RentalRateText } from './RentalRateCard'

export type RentalViewCardParams = {
  tokenData: TokenData
  otpKeypair?: Keypair
}

export const RentalViewCard = ({ tokenData }: RentalViewCardParams) => {
  const walletId = useWalletId()
  const type = rentalType(tokenData)
  const canEdit =
    walletId?.toString() === tokenData.tokenManager?.parsed.issuer.toString()

  return (
    <div className="rounded-lg bg-dark-6 p-8">
      <RentalClaimCardTokenHeader tokenData={tokenData} />
      {
        {
          duration: <RentalFixedText tokenData={tokenData} />,
          rate: <RentalRateText tokenData={tokenData} />,
          expiration: <RentalFixedExpirationText tokenData={tokenData} />,
          manual: <RentalManualText />,
        }[type]
      }
      <div className="flex flex-col gap-4">
        {
          {
            duration: <RentalFixedInfo tokenData={tokenData} />,
            rate: <RentalRateInfo tokenData={tokenData} />,
            expiration: <RentalFixedExpirationInfo tokenData={tokenData} />,
            manual: <RentalManualInfo tokenData={tokenData} />,
          }[type]
        }
        {(tokenData.tokenManager?.parsed.state === TokenManagerState.Claimed ||
          !canEdit) && (
          <RentalSummary
            tokenData={tokenData}
            extendedSeconds={
              type === 'rate' &&
              tokenData.tokenManager &&
              tokenData.tokenManager.parsed.state === TokenManagerState.Claimed
                ? tokenData.timeInvalidator?.parsed.expiration
                    ?.sub(tokenData.tokenManager?.parsed.stateChangedAt)
                    .toNumber()
                : undefined
            }
          />
        )}
      </div>
      <PoweredByFooter />
    </div>
  )
}
export const useRentalViewCard = () => {
  const { showModal } = useModal()
  return {
    showModal: (params: RentalViewCardParams) =>
      showModal(<RentalViewCard {...params} />),
  }
}
