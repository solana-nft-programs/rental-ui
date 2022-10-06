import { getExpirationString } from '@cardinal/common'
import {
  InvalidationType,
  TokenManagerState,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { TokenData } from 'apis/api'
import { useMintMetadata } from 'hooks/useMintMetadata'
import { useUTCNow } from 'providers/UTCNowProvider'

import { NFTAttributeInfo } from './NFTAttributeInfo'
import { NFTContexualMenu } from './NFTContexualMenu'
import { getNameFromTokenData, invalidationTypeInfo } from './tokenDataUtils'
import { Tooltip } from './Tooltip'

export const getExpiration = (
  tokenData: Pick<TokenData, 'timeInvalidator' | 'tokenManager'>,
  UTCNow: number
): string | undefined => {
  if (
    tokenData?.tokenManager?.parsed.state !== TokenManagerState.Claimed &&
    tokenData.tokenManager?.parsed.invalidationType !== InvalidationType.Vest
  ) {
    return
  }
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
  tokenData: Pick<
    TokenData,
    'timeInvalidator' | 'tokenManager' | 'metaplexData' | 'indexedData'
  >
  displayInvalidationInfo?: boolean
}

export function NFT({ tokenData, displayInvalidationInfo }: NFTProps) {
  const { UTCNow } = useUTCNow()
  const metadata = useMintMetadata(tokenData).data
  const invalidationType = invalidationTypeInfo(
    tokenData.tokenManager?.parsed.invalidationType
  )
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
        {displayInvalidationInfo && tokenData.tokenManager && (
          <Tooltip title={invalidationType.tooltip}>
            <div
              className={`absolute bottom-3 left-3 z-20 flex cursor-pointer items-center justify-center gap-1 rounded-md bg-dark-5 px-2 py-1 text-sm`}
            >
              <div className={`${invalidationType.color}`}>
                {invalidationType.displayName}
              </div>
            </div>
          </Tooltip>
        )}
        <NFTAttributeInfo
          className={`absolute bottom-3 right-3 z-20`}
          tokenData={tokenData}
        />
        {metadata && metadata.parsed.image ? (
          <img
            loading="lazy"
            src={metadata.parsed.image}
            alt={getNameFromTokenData(tokenData)}
            className={`aspect-square w-full rounded-xl object-contain`}
          />
        ) : (
          <div
            className={`h-[320px] w-full grow animate-pulse rounded-xl bg-border`}
          />
        )}
      </div>
    </div>
  )
}
