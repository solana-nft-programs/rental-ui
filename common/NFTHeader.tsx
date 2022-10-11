import { DisplayAddress } from '@cardinal/namespaces-components'
import { logConfigTokenDataEvent } from 'monitoring/amplitude'
import type { TokenData } from 'apis/api'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import { FaLink } from 'react-icons/fa'

import { notify } from './Notification'
import { getNameFromTokenData } from './tokenDataUtils'

export const handleCopy = async (shareUrl: string) => {
  await navigator.clipboard.writeText(shareUrl)
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
    <div className="flex w-full flex-col justify-between">
      <div
        className="flex w-full cursor-pointer items-center gap-2 font-bold"
        onClick={(e) => {
          if (!tokenData.tokenManager) return
          e.stopPropagation()
          logConfigTokenDataEvent('nft: click claim link', config, tokenData)
          handleCopy(
            getLink(
              `/${config.name}/${tokenData.tokenManager?.pubkey.toBase58()}`
            )
          )
        }}
      >
        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-left text-lg">
          {getNameFromTokenData(tokenData, 'Unknown')}
        </div>
        {tokenData.tokenManager && <FaLink />}
      </div>
      <div className="flex items-center justify-between text-sm text-light-2">
        <DisplayAddress
          dark
          connection={secondaryConnection}
          address={tokenData.tokenManager?.parsed.issuer || undefined}
        />
      </div>
    </div>
  )
}
