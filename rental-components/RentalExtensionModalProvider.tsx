import type { Wallet } from '@saberhq/solana-contrib'
import type { Connection } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { withSleep } from 'common/utils'
import React, { useContext, useState } from 'react'

import { RentalExtensionCard } from './components/RentalExtensionCard'
import { Modal } from './modal'

interface RentalExtensionModal {
  show: (
    wallet: Wallet,
    connection: Connection,
    cluster: string,
    tokenData: TokenData,
    dev?: boolean
  ) => void
  showRentalExtensionModal: boolean
  tokenData: TokenData | undefined
}

export const RentalExtensionModalContext =
  React.createContext<RentalExtensionModal | null>(null)
interface Props {
  children: React.ReactNode
}

export const RentalExtensionModalProvider: React.FC<Props> = ({
  children,
}: Props) => {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [connection, setConnection] = useState<Connection | null>(null)
  const [cluster, setCluster] = useState<string | undefined>(undefined)
  const [dev, setDev] = useState<boolean | undefined>(undefined)
  const [showRentalExtensionModal, setShowRentalExtensionModal] =
    useState<boolean>(false)
  const [tokenData, setTokenData] = useState<TokenData | undefined>(undefined)

  return (
    <RentalExtensionModalContext.Provider
      value={{
        show: (wallet, connection, cluster, tokenData, dev) => {
          setWallet(wallet)
          setConnection(connection)
          setCluster(cluster)
          setTokenData(tokenData)
          setDev(dev)
          setShowRentalExtensionModal(true)
        },
        tokenData,
        showRentalExtensionModal,
      }}
    >
      <Modal
        isOpen={showRentalExtensionModal}
        onDismiss={() => setShowRentalExtensionModal(false)}
        darkenOverlay={true}
      >
        {wallet && connection && (
          <RentalExtensionCard
            dev={dev}
            cluster={cluster}
            wallet={wallet}
            connection={connection}
            tokenData={tokenData || {}}
            onComplete={() => {
              withSleep(() => {
                setShowRentalExtensionModal(false)
              }, 1000)
            }}
          />
        )}
      </Modal>
      {children}
    </RentalExtensionModalContext.Provider>
  )
}

export const useRentalExtensionModal = (): RentalExtensionModal => {
  const rentalExtensionModalContext = useContext(RentalExtensionModalContext)
  if (!rentalExtensionModalContext) {
    throw new Error('Not in rentalExtensionModalContext context')
  }
  return rentalExtensionModalContext
}
