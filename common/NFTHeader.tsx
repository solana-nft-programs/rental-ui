import { DisplayAddress } from '@cardinal/namespaces-components'
import { logConfigTokenDataEvent } from 'apis/amplitude'
import type { TokenData } from 'apis/api'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import { FaLink } from 'react-icons/fa'

import { notify } from './Notification'
import { getNameFromTokenData } from './tokenDataUtils'

export const handleCopy = (shareUrl: string) => {
  navigator.clipboard.writeText(shareUrl)
  notify({
    message: 'Share link copied',
    description: 'Paste this link from your clipboard',
  })
}

interface NFTHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData
}

export const NFTHeader: React.FC<NFTHeaderProps> = ({
  tokenData,
}: NFTHeaderProps) => {
  const { config } = useProjectConfig()
  const { secondaryConnection } = useEnvironmentCtx()
  return (
    <div
      className="flex w-full cursor-pointer flex-col justify-between"
      onClick={(e) => {
        if (!tokenData.tokenManager) return
        e.stopPropagation()
        logConfigTokenDataEvent('nft: click claim link', config, tokenData)
        handleCopy(
          getLink(
            `/${config.name}/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
          )
        )
      }}
    >
      <div className="flex items-center gap-2 font-bold">
        <div className="w-fit overflow-hidden text-ellipsis whitespace-nowrap text-left text-lg">
          {getNameFromTokenData(tokenData, 'Unknown')}
        </div>
        {tokenData.tokenManager && (
          <div className="flex w-fit">
            <FaLink />
          </div>
        )}
      </div>
      <div className="text-sm text-light-2">
        <DisplayAddress
          connection={secondaryConnection}
          address={tokenData.tokenManager?.parsed.issuer || undefined}
          height="18px"
          width="100px"
          dark={true}
        />
      </div>
    </div>
  )
}
