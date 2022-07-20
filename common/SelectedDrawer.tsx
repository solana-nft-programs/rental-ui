import { css } from '@emotion/react'
import { useWallet } from '@solana/wallet-adapter-react'
import type { TokenData } from 'api/api'
import { GlyphClose } from 'assets/GlyphClose'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useRentalModal } from 'rental-components/RentalModalProvider'

import { Button } from './Button'
import { asWallet } from './Wallets'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  selectedTokens: TokenData[]
  onClose?: () => void
}

export const SelecterDrawer: React.FC<Props> = ({
  selectedTokens,
  onClose,
}: Props) => {
  const { config } = useProjectConfig()
  const wallet = useWallet()
  const { connection, environment } = useEnvironmentCtx()
  const rentalModal = useRentalModal()
  return (
    <div
      className={`fixed z-30 flex w-full items-center justify-between gap-4 bg-dark-6 px-4 py-8 transition-all lg:px-12 ${
        selectedTokens.length > 0 ? 'bottom-0' : '-bottom-32'
      }`}
      css={css`
        box-shadow: 0px 144px 100px 200px rgba(12, 12, 13, 1);
      `}
    >
      <div className="text-lg">
        You selected {selectedTokens.length ? `(${selectedTokens.length})` : ''}{' '}
        items
      </div>
      <div className="flex items-center gap-2">
        <Button
          disabled={selectedTokens.length === 0}
          variant="primary"
          className="px-4 lg:px-8"
          onClick={() =>
            rentalModal.show(
              asWallet(wallet),
              connection,
              environment.label,
              selectedTokens,
              config.rentalCard
            )
          }
        >
          Rent out
        </Button>
        <div className="mx-4 h-8 w-[2px] bg-border"></div>
        <div className="cursor-pointer" onClick={() => onClose && onClose()}>
          <GlyphClose />
        </div>
      </div>
    </div>
  )
}
