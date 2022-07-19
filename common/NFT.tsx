import type { TokenData } from 'api/api'
import type { ProjectConfig } from 'config/config'
import { lighten } from 'polished'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

import { NFTContexualMenu } from './NFTContexualMenu'
import { NFTOverlay } from './NFTOverlay'

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

interface NFTProps {
  tokenData: TokenData
  onClick?: () => void
}

export function NFT({ tokenData, onClick }: NFTProps) {
  const { config } = useProjectConfig()
  const { metadata, tokenManager, timeInvalidator, useInvalidator } = tokenData

  return (
    <div
      className="relative w-[280px] rounded-xl"
      style={{
        background: lighten(0.02, config.colors.main),
      }}
    >
      <NFTContexualMenu tokenData={tokenData} />
      <div
        className={`z-0 flex h-[280px] max-w-full cursor-pointer items-center justify-center`}
        onClick={() => {
          onClick ? onClick() : () => {}
        }}
      >
        {tokenManager && (
          <NFTOverlay
            state={tokenManager?.parsed.state}
            expiration={
              timeInvalidator?.parsed?.expiration?.toNumber() ||
              timeInvalidator?.parsed?.maxExpiration?.toNumber() ||
              undefined
            }
            durationSeconds={
              timeInvalidator?.parsed?.durationSeconds?.toNumber() || undefined
            }
            usages={useInvalidator?.parsed.usages.toNumber()}
            totalUsages={useInvalidator?.parsed.totalUsages?.toNumber()}
            lineHeight={14}
            stateChangedAt={
              tokenManager?.parsed.stateChangedAt?.toNumber() || undefined
            }
            additionalInvalidators={
              tokenManager?.parsed.invalidators.length === 1 &&
              tokenManager.parsed.invalidators[0]?.toString() ===
                tokenData?.recipientTokenAccount?.owner.toString()
                ? ['Staked']
                : []
            }
          />
        )}
        {metadata && metadata.data && (
          <img
            loading="lazy"
            src={metadata.data.image}
            // src={customImageUri || metadata.data.image}
            alt={metadata.data.name}
            className={`h-full rounded-t-xl object-contain`}
          />
        )}
      </div>
    </div>
  )
}
