import { getExpirationString } from '@cardinal/common'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { TokenData } from 'api/api'
import type { ProjectConfig } from 'config/config'
import { lighten } from 'polished'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'

import { NFTContexualMenu } from './NFTContexualMenu'

export const getAllAttributes = (
  tokens: TokenData[]
): {
  [traitType: string]: string[]
} => {
  const allAttributes: { [traitType: string]: Set<any> } = {}
  tokens.forEach((tokenData) => {
    if (
      tokenData?.metadata?.data?.attributes &&
      tokenData?.metadata?.data?.attributes.length > 0
    ) {
      tokenData?.metadata?.data?.attributes.forEach(
        (attribute: { trait_type: string; value: string }) => {
          if (attribute.trait_type in allAttributes) {
            allAttributes[attribute.trait_type]!.add(attribute.value)
          } else {
            allAttributes[attribute.trait_type] = new Set([attribute.value])
          }
        }
      )
    }
  })

  const sortedAttributes: { [traitType: string]: string[] } = {}
  Object.keys(allAttributes).forEach((traitType) => {
    sortedAttributes[traitType] = Array.from(allAttributes[traitType] ?? [])
  })
  return sortedAttributes
}

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
  const { timeInvalidator, tokenManager } = tokenData
  if (tokenManager?.parsed.state !== TokenManagerState.Claimed) return
  return timeInvalidator?.parsed.maxExpiration
    ? getExpirationString(
        timeInvalidator?.parsed.maxExpiration.toNumber(),
        UTCNow,
        { delimiter: ':', capitalizeSuffix: true, showZeros: true }
      )
    : timeInvalidator?.parsed.expiration
    ? getExpirationString(
        timeInvalidator?.parsed.expiration.toNumber(),
        UTCNow,
        { delimiter: ':', capitalizeSuffix: true, showZeros: true }
      )
    : (timeInvalidator?.parsed.durationSeconds &&
        getExpirationString(
          tokenManager?.parsed.stateChangedAt
            .add(timeInvalidator?.parsed.durationSeconds)
            .toNumber(),
          UTCNow,
          { delimiter: ':', capitalizeSuffix: true, showZeros: true }
        )) ||
      undefined
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
      className="relative w-[280px] rounded-xl"
      style={{
        background: lighten(0.02, config.colors.main),
      }}
    >
      <NFTContexualMenu tokenData={tokenData} />
      <div
        className={`relative flex h-[280px] max-w-full items-center justify-center`}
      >
        {getExpiration(tokenData, UTCNow) && (
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
