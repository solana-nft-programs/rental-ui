import { logConfigTokenDataEvent } from 'apis/amplitude'
import type { TokenData } from 'apis/api'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useRentalViewCard } from 'rental-components/components/RentalViewCard'

import { ButtonSmall } from './ButtonSmall'
import { NFTRevokeButton } from './NFTRevokeButton'
import { rentalType } from './tokenDataUtils'

interface NFTViewRentalProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData
}

export const NFTViewRental: React.FC<NFTViewRentalProps> = ({
  tokenData,
}: NFTViewRentalProps) => {
  const { config } = useProjectConfig()
  const rentalViewCard = useRentalViewCard()

  return (
    <div className="flex gap-1">
      <NFTRevokeButton tokenData={tokenData} />
      <ButtonSmall
        onClick={(e) => {
          e.stopPropagation()
          rentalViewCard.showModal({ tokenData })
          logConfigTokenDataEvent('nft: click claim', config, tokenData, {
            rental_type: rentalType(tokenData),
          })
        }}
      >
        View
      </ButtonSmall>
    </div>
  )
}
