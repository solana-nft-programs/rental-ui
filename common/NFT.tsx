import { getExpirationString } from '@cardinal/common'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { TokenData } from 'api/api'
import type { ProjectConfig } from 'config/config'
import { lighten } from 'polished'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'

import { NFTContexualMenu } from './NFTContexualMenu'

export const elligibleForRent = (
  config: ProjectConfig,
  tokenData: TokenData
): boolean => {
  return (
    !config.disableListing &&
    !tokenData.tokenManager &&
    tokenData.tokenAccount?.account.data.parsed.info.state !== 'frozen' &&
    !!tokenData.editionData &&
    (!tokenData.mint || !!tokenData.mint.freezeAuthority)
  )
}

export const stateColor = (state: TokenManagerState, light = false): string => {
  if (state === TokenManagerState.Invalidated) {
    return 'rgba(125, 0, 0, 1)'
  } else if (state === TokenManagerState.Issued) {
    return light ? '#d89614' : '#593815'
  } else if (state === TokenManagerState.Claimed) {
    return light ? '#52c41a' : '#274916'
  } else {
    return 'rgba(255, 255, 255, 0.3)`'
  }
}

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
          (durationSeconds?.toNumber() ?? 0)
    ),
    UTCNow,
    { delimiter: ':', capitalizeSuffix: true, showZeros: true }
  )
}

interface NFTProps {
  tokenData: TokenData
}

export function NFT({ tokenData }: NFTProps) {
  const { config } = useProjectConfig()
  const { UTCNow } = useUTCNow()
  const { metadata } = tokenData
  return (
    <div
      className="relative w-full max-w-[320px] rounded-xl"
      style={{
        background: lighten(0.02, config.colors.main),
      }}
    >
      <NFTContexualMenu tokenData={tokenData} />
      <div className={`relative flex w-full items-center justify-center`}>
        {tokenData.timeInvalidator && getExpiration(tokenData, UTCNow) && (
          <div
            className={`absolute top-3 left-3 z-20 rounded-md bg-dark-5 px-2 py-1 text-sm text-light-0`}
          >
            ⏰ {getExpiration(tokenData, UTCNow)}
          </div>
        )}
        {metadata && metadata.data && (
          <img
            loading="lazy"
            src={metadata.data.image}
            alt={metadata.data.name}
            className={`h-full rounded-t-xl object-contain`}
          />
        )}
      </div>
    </div>
  )
}
