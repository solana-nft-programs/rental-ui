import { shortDateString } from '@cardinal/common'
import { BN } from '@project-serum/anchor'
import type * as splToken from '@solana/spl-token'
import type { TokenData } from 'api/api'
import {
  getPriceFromTokenData,
  getSymbolFromTokenData,
} from 'components/Browse'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useUTCNow } from 'providers/UTCNowProvider'
import { SolanaLogo } from 'rental-components/common/icons'
import { secondsToStringForDisplay } from 'rental-components/components/RentalFixedCard'

import { getMintDecimalAmount } from './units'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData
  extensionSeconds?: number
}

export const getExtensionPrice = (
  tokenData: TokenData,
  extensionSeconds: number,
  paymentMints?: { [name: string]: splToken.MintInfo }
): number => {
  if (
    !paymentMints ||
    !tokenData.timeInvalidator?.parsed.extensionPaymentMint ||
    !tokenData.timeInvalidator?.parsed.extensionPaymentAmount ||
    !tokenData.timeInvalidator?.parsed.extensionDurationSeconds
  ) {
    return 0
  }

  const mintInfo =
    paymentMints[
      tokenData.timeInvalidator?.parsed?.extensionPaymentMint.toString()
    ]
  if (!mintInfo) return 0
  return getMintDecimalAmount(
    mintInfo,
    (tokenData.timeInvalidator?.parsed.extensionPaymentAmount ?? new BN(0))
      .mul(new BN(extensionSeconds))
      .div(
        tokenData.timeInvalidator?.parsed.extensionDurationSeconds ?? new BN(1)
      )
  ).toNumber()
}

export const RentalSummary: React.FC<Props> = ({
  tokenData,
  extensionSeconds,
}: Props) => {
  const { UTCNow } = useUTCNow()
  const paymentMints = usePaymentMints()
  const { durationSeconds } = tokenData.timeInvalidator?.parsed || {}
  return (
    <div className="flex justify-between gap-4 border-t-[1px] border-border pt-4">
      <div className="flex gap-4">
        <div>
          <SolanaLogo width={24} height={24} className="mt-2" />
        </div>
        <div className="mb-2">
          <div className="text-lg font-medium">
            {extensionSeconds
              ? getExtensionPrice(
                  tokenData,
                  extensionSeconds,
                  paymentMints.data
                )
              : getPriceFromTokenData(tokenData, paymentMints.data)}{' '}
            {getSymbolFromTokenData(tokenData)} for{' '}
            {secondsToStringForDisplay(
              extensionSeconds ??
                tokenData.timeInvalidator?.parsed?.durationSeconds?.toNumber() ??
                0,
              {
                fullSuffix: true,
                delimiter: ' ',
                showTrailingZeros: false,
              }
            )}
          </div>
          <div className="text-sm text-medium-3">
            Expires on{' '}
            {shortDateString(UTCNow + (durationSeconds?.toNumber() ?? 0))}
          </div>
        </div>
      </div>
    </div>
  )
}
