import type { Keypair } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { Modal } from 'common/Modal'
import React, { useContext, useState } from 'react'

import { RentalRateCard } from './components/RentalRateCard'

interface RentalRateModal {
  show: (tokenData: TokenData, claim?: boolean, otpKeypair?: Keypair) => void
  showRentalRateModal: boolean
  tokenData: TokenData | undefined
}

export const RentalRateModalContext =
  React.createContext<RentalRateModal | null>(null)
interface Props {
  children: React.ReactNode
}

export const RentalRateModalProvider: React.FC<Props> = ({
  children,
}: Props) => {
  const [showRentalRateModal, setShowRentalRateModal] = useState<boolean>(false)
  const [tokenData, setTokenData] = useState<TokenData | undefined>(undefined)
  const [otpKeypair, setOtpKeypair] = useState<Keypair | undefined>(undefined)
  const [claim, setClaim] = useState(true)

  return (
    <RentalRateModalContext.Provider
      value={{
        show: (tokenData, claim, otpKeypair) => {
          setTokenData(tokenData)
          setShowRentalRateModal(true)
          setClaim(claim ?? false)
          setOtpKeypair(otpKeypair)
        },
        tokenData,
        showRentalRateModal,
      }}
    >
      <Modal
        isOpen={showRentalRateModal}
        onDismiss={() => setShowRentalRateModal(false)}
      >
        <RentalRateCard
          claim={claim}
          tokenData={tokenData || {}}
          otpKeypair={otpKeypair}
        />
      </Modal>
      {children}
    </RentalRateModalContext.Provider>
  )
}

export const useRentalRateModal = (): RentalRateModal => {
  const rentalRateModalContext = useContext(RentalRateModalContext)
  if (!rentalRateModalContext) {
    throw new Error('Not in RentalRateModalContext context')
  }
  return rentalRateModalContext
}
