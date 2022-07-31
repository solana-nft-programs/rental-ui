import { getExpirationString } from '@cardinal/common'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { TokenData } from 'apis/api'
import { useUTCNow } from 'providers/UTCNowProvider'

import { NFTContexualMenu } from './NFTContexualMenu'

export const getExpiration = (
  tokenData: TokenData,
  UTCNow: number
): string | undefined => {
  if (tokenData?.tokenManager?.parsed.state !== TokenManagerState.Claimed)
    return
  const { durationSeconds, expiration, maxExpiration } =
    tokenData.timeInvalidator?.parsed || {}

  return getExpirationString(
    Math.min(
      maxExpiration?.toNumber() ?? Infinity,
      expiration?.toNumber() ??
        tokenData.tokenManager.parsed.stateChangedAt.toNumber() +
          (durationSeconds?.toNumber() ?? Infinity)
    ),
    UTCNow,
    { delimiter: ':', capitalizeSuffix: true, showZeros: true }
  )
}

interface NFTProps {
  tokenData: TokenData
}

export function NFT({ tokenData }: NFTProps) {
  const { UTCNow } = useUTCNow()
  const { metadata } = tokenData
  return (
    <div className="relative min-w-full rounded-xl bg-dark-5">
      <NFTContexualMenu tokenData={tokenData} />
      <div className={`relative flex w-full items-center justify-center`}>
        {tokenData.timeInvalidator && getExpiration(tokenData, UTCNow) ? (
          <div
            className={`absolute top-3 left-3 z-20 rounded-md bg-dark-5 px-2 py-1 text-sm text-light-0`}
          >
            ⏰ {getExpiration(tokenData, UTCNow)}
          </div>
        ) : (
          tokenData && (
            <div className={`absolute top-3 left-3 z-20`}>
              {/* {rentalTypePill(rentalType(tokenData))} */}
            </div>
          )
        )}
        {metadata && metadata.data && (
          <img
            loading="lazy"
            src={metadata.data.image}
            alt={metadata.data.name}
            className={`w-full rounded-t-xl object-contain`}
          />
        )}
      </div>
    </div>
  )
}
