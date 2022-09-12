import { getExpirationString } from '@cardinal/common'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { TokenData } from 'apis/api'
import { useMintMetadata } from 'hooks/useMintMetadata'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'

import { NFTContexualMenu } from './NFTContexualMenu'
import { getNameFromTokenData } from './tokenDataUtils'

export const getExpiration = (
  tokenData: Pick<TokenData, 'timeInvalidator' | 'tokenManager'>,
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
  tokenData: Pick<
    TokenData,
    'timeInvalidator' | 'tokenManager' | 'metaplexData' | 'indexedData'
  >
}

export function NFT({ tokenData }: NFTProps) {
  const { UTCNow } = useUTCNow()
  const { config } = useProjectConfig()
  const metadata = useMintMetadata(tokenData).data
  const attributesByTraitType = metadata?.parsed.attributes?.reduce(
    (acc, attr) => ({ ...acc, [attr.trait_type]: attr }),
    {} as { [trait_type: string]: { value: string } }
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
        {attributesByTraitType &&
          config.attributeDisplay &&
          config.attributeDisplay.map(
            ({ displayName, attributeName }, i) =>
              attributesByTraitType[attributeName] && (
                <div
                  key={i}
                  className={`absolute bottom-3 right-3 z-20 rounded-md bg-dark-5 px-2 py-1 text-sm text-light-0`}
                >
                  <span className="font-semibold">
                    {displayName || attributeName}:{' '}
                  </span>
                  {attributesByTraitType[attributeName]?.value}
                </div>
              )
          )}
        {metadata && metadata.parsed.image ? (
          <img
            loading="lazy"
            src={metadata.parsed.image}
            alt={getNameFromTokenData(tokenData)}
            className={`w-full rounded-xl object-contain`}
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
