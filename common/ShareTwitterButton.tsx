import { css } from '@emotion/react'
import type { ProjectConfig } from 'config/config'
import type { TokenData } from 'data/data'
import type { IssueTxResult } from 'handlers/useHandleIssueRental'
import { logConfigTokenDataEvent } from 'monitoring/amplitude'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

import { getNameFromTokenData } from './tokenDataUtils'

type Props = {
  children: string | JSX.Element
  className?: string
  disabled?: boolean
  shareLink: string
  shareType: 'issue' | 'claim'
  tokenDatas: TokenData[]
}

const BASE_URL = `https://twitter.com/intent/tweet?text=`

export const shareTwitterClaimedLink = (
  tokenData: TokenData,
  config: ProjectConfig,
  issuerName?: string
) => {
  const tokenName = getNameFromTokenData(tokenData)
  return [
    BASE_URL,
    encodeURIComponent(
      `I just rented ${
        tokenName
          ? `${
              config.twitterHandle ? `${config.twitterHandle} ` : ''
            }${tokenName}`
          : `a ${config.twitterHandle ? `${config.twitterHandle} ` : ''}NFT`
      }${
        issuerName ? ` from ${issuerName}` : ''
      } using @ rental UI! Check it out at https://rent.host.so/${
        config.name
      }/${tokenData.tokenManager?.pubkey.toString()}`
    ),
  ].join('')
}

export const shareTwitterListedLink = (
  txResults: IssueTxResult[],
  config: ProjectConfig
) => {
  if (txResults.length === 1) {
    const { tokenData, claimLink } = txResults[0]!
    const tokenName = getNameFromTokenData(tokenData)
    return [
      BASE_URL,
      encodeURIComponent(
        `I just listed ${
          tokenName
            ? `${
                config.twitterHandle ? `${config.twitterHandle} ` : ''
              }${tokenName}`
            : `a ${config.twitterHandle ? `${config.twitterHandle} ` : ''}NFT`
        } for rent using @ rental UI! Check it out at ${claimLink}`
      ),
    ].join('')
  }
  return [
    BASE_URL,
    encodeURIComponent(
      `I just listed ${txResults.length} ${
        config.twitterHandle ? `${config.twitterHandle} ` : ''
      }NFTs! Check it out at https://rent.host.so/${config.name}`
    ),
  ].join('')
}

export const ShareTwitterButton: React.FC<Props> = ({
  children,
  className,
  disabled,
  shareLink,
  shareType,
  tokenDatas,
  ...rest
}: Props) => {
  const { config } = useProjectConfig()

  return (
    <a
      {...rest}
      className={`flex items-center justify-center gap-5 rounded-xl transition-all ${className} ${
        disabled ? 'cursor-default bg-medium-4' : 'cursor-pointer bg-twitter'
      }`}
      css={css`
        &:hover {
          filter: brightness(115%);
        }
      `}
      target="_blank"
      rel="noreferrer"
      href={shareLink}
      onClick={() => {
        for (const tokenData of tokenDatas) {
          logConfigTokenDataEvent(
            `${shareType} rental: click share`,
            config,
            tokenData
          )
        }
      }}
    >
      <div className="flex items-center justify-center gap-1">
        {children && (
          <div
            className={`py-3 ${disabled ? 'text-medium-3' : 'text-light-0'}`}
          >
            {children}
          </div>
        )}
      </div>
    </a>
  )
}
