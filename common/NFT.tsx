import { getExpirationString } from '@cardinal/common'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { TokenData } from 'api/api'
import type { ProjectConfig } from 'config/config'
import { lighten } from 'polished'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'
import type { InvalidatorOption } from 'rental-components/components/RentalIssueCard'

import { NFTContexualMenu } from './NFTContexualMenu'
import { isRateBasedListing } from './NFTIssuerInfo'
import { Pill } from './Pill'

export const rentalType = (tokenData: TokenData) => {
  return !tokenData.timeInvalidator && !tokenData.useInvalidator
    ? 'manual'
    : isRateBasedListing(tokenData)
    ? 'rate'
    : tokenData.timeInvalidator?.parsed?.durationSeconds
    ? 'duration'
    : 'expiration'
}

export const rentalTypeColor = (type: InvalidatorOption) =>
  ({
    manual: 'text-primary-2',
    rate: 'text-primary',
    duration: 'text-secondary',
    expiration: 'text-blue',
  }[type])

export const rentalTypePill = (type: InvalidatorOption) =>
  ({
    manual: (
      <Pill className="border-[1px] border-border text-primary-2">Manual</Pill>
    ),
    rate: (
      <Pill className="border-[1px] border-border text-primary">
        Rate rental
      </Pill>
    ),
    duration: (
      <Pill className="border-[1px] border-border text-secondary">
        Fixed duration
      </Pill>
    ),
    expiration: (
      <Pill className="border-[1px] border-border text-blue">
        Fixed expiration
      </Pill>
    ),
  }[type])

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

export const elligibleForClaim = (tokenData: TokenData): boolean => {
  return (
    !!tokenData.tokenManager &&
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
  const { config } = useProjectConfig()
  const { UTCNow } = useUTCNow()
  const { metadata } = tokenData
  return (
    <div
      className="relative min-w-full rounded-xl"
      style={{
        background: lighten(0.02, config.colors.main),
      }}
    >
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
              {rentalTypePill(rentalType(tokenData))}
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
