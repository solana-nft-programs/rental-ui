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
    dev?: boolean
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
  const [dev, setDev] = useState<boolean | undefined>(undefined)
  const [showRentalRateModal, setShowRentalRateModal] = useState<boolean>(false)
  const [tokenData, setTokenData] = useState<TokenData | undefined>(undefined)
  const { config } = useProjectConfig()

  return (
    <RentalRateModalContext.Provider
      value={{
        show: (wallet, connection, cluster, tokenData, dev) => {
          setWallet(wallet)
          setConnection(connection)
          setCluster(cluster)
          setTokenData(tokenData)
          setDev(dev)
          setShowRentalRateModal(true)
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
            dev={dev}
            cluster={cluster}
            wallet={wallet}
            connection={connection}
            tokenData={tokenData || {}}
            config={config}
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
