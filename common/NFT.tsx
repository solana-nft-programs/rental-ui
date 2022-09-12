import { getExpirationString } from '@cardinal/common'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { TokenData } from 'apis/api'
import { useMintMetadata } from 'hooks/useMintMetadata'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'
import { BsFillInfoCircleFill } from 'react-icons/bs'

import { NFTContexualMenu } from './NFTContexualMenu'
import { getNameFromTokenData } from './tokenDataUtils'
import { Tooltip } from './Tooltip'

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
        {attributesByTraitType && (
          <div
            className={`absolute bottom-3 right-3 z-20 flex items-center gap-3 rounded-md text-light-0 ${
              config.attributeDisplay && 'bg-dark-5 px-2 py-1'
            }`}
          >
            {config.attributeDisplay &&
              config.attributeDisplay.map(
                ({ displayName, attributeName }, i) =>
                  attributesByTraitType[attributeName] && (
                    <div className="flex items-center gap-1">
                      <div className="font-semibold">
                        {displayName || attributeName}:{' '}
                      </div>
                      <div>{attributesByTraitType[attributeName]?.value}</div>
                    </div>
                  )
              )}
            <Tooltip
              className={`rounded-md text-light-0`}
              title={
                <div>
                  {metadata?.parsed.attributes?.map((attr, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between gap-1 rounded-md py-[2px] text-sm text-light-0`}
                    >
                      <div className="font-bold">{attr.trait_type}</div>
                      <div className="text-light-2">{attr?.value}</div>
                    </div>
                  ))}
                </div>
              }
            >
              <div
                className={`flex cursor-pointer items-center gap-1 ${
                  config.attributeDisplay
                    ? 'scale-[1.25] text-light-2'
                    : 'scale-[1.5] text-dark-6'
                }`}
              >
                <BsFillInfoCircleFill />
              </div>
            </Tooltip>
          </div>
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
