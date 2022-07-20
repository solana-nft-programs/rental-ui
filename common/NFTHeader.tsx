import type { TokenData } from 'api/api'
import { handleCopy } from 'components/Browse'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import { FaLink } from 'react-icons/fa'

interface NFTHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData
}

export const NFTHeader: React.FC<NFTHeaderProps> = ({
  tokenData,
}: NFTHeaderProps) => {
  const { config } = useProjectConfig()
  return (
    <div
      className="flex w-full cursor-pointer flex-row text-sm font-bold text-white"
      onClick={() =>
        handleCopy(
          getLink(
            `/${config.name}/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
          )
        )
      }
    >
      <p className="flex w-fit overflow-hidden text-ellipsis whitespace-nowrap text-left">
        {tokenData.metadata?.data?.name}
      </p>
      <div className="ml-[6px] mt-[2px] flex w-fit">
        <FaLink />
      </div>
    </div>
  )
}
