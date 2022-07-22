import { css } from '@emotion/react'
import type { TokenData } from 'api/api'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

type Props = {
  children: string | JSX.Element
  className?: string
  disabled?: boolean
  tokenData: TokenData
  issuerName?: string
}

export const ShareTwitterButton: React.FC<Props> = ({
  children,
  className,
  disabled,
  tokenData,
  issuerName,
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
      href={[
        `https://twitter.com/intent/tweet?text=`,
        encodeURIComponent(
          `I just rented ${
            tokenData.metaplexData?.data.data.name
              ? `${config.twitterHandle ?? ''} ${
                  tokenData.metaplexData?.data.data.name
                }`
              : `a ${config.twitterHandle ?? ''} NFT`
          }${
            issuerName ? ` from ${issuerName}` : ''
          }! Check it out at https://rent.cardinal.so/claim/${tokenData.tokenManager?.pubkey.toString()}`
        ),
      ].join('')}
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
