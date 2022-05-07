import type { Wallet } from '@saberhq/solana-contrib'
import type { Connection } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { withSleep } from 'common/utils'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import React, { useContext, useState } from 'react'

import { RentalRateCard } from './components/RentalRateCard'
import { Modal } from './modal'

interface RentalRateModal {
  show: (
    wallet: Wallet,
    connection: Connection,
    cluster: string,
    tokenData: TokenData,
    claim?: boolean
  ) => void
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
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [connection, setConnection] = useState<Connection | null>(null)
  const [cluster, setCluster] = useState<string | undefined>(undefined)
  const [showRentalRateModal, setShowRentalRateModal] = useState<boolean>(false)
  const [tokenData, setTokenData] = useState<TokenData | undefined>(undefined)
  const [claim, setClaim] = useState(true)
  const { config } = useProjectConfig()

  return (
    <RentalRateModalContext.Provider
      value={{
        show: (wallet, connection, cluster, tokenData, claim) => {
          setWallet(wallet)
          setConnection(connection)
          setCluster(cluster)
          setTokenData(tokenData)
          setShowRentalRateModal(true)
          setClaim(claim ?? false)
        },
        tokenData,
        showRentalRateModal,
      }}
    >
      <Modal
        isOpen={showRentalRateModal}
        onDismiss={() => setShowRentalRateModal(false)}
        darkenOverlay={true}
      >
        {wallet && connection && (
          <RentalRateCard
            cluster={cluster}
            wallet={wallet}
            connection={connection}
            tokenData={tokenData || {}}
            config={config}
            claim={claim}
            onComplete={() => {
              withSleep(() => {
                setShowRentalRateModal(false)
              }, 1000)
            }}
          />
        )}
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
