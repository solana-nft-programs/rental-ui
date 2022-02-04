import { Wallet } from '@saberhq/solana-contrib'
import { Connection } from '@solana/web3.js'
import { TokenData } from 'api/api'
import React, { useContext, useState } from 'react'
import { RentalCard } from './components/RentalCard'
import { Modal } from './modal'

export const withSleep = async (fn: Function, sleep = 2000) => {
  await new Promise((r) => setTimeout(r, sleep))
  await fn()
}

export interface RentalModal {
  show: (
    wallet: Wallet,
    connection: Connection,
    cluster: string,
    tokenData: TokenData,
    dev?: boolean
  ) => void
  showRentalModal: boolean
  tokenData: TokenData | undefined
}

export const RentalModalContext = React.createContext<RentalModal | null>(null)

interface Props {
  appName?: string
  appTwitter?: string
  children: React.ReactNode
}

export const RentalModalProvider: React.FC<Props> = ({
  appName,
  appTwitter,
  children,
}: Props) => {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [connection, setConnection] = useState<Connection | null>(null)
  const [cluster, setCluster] = useState<string | undefined>(undefined)
  const [dev, setDev] = useState<boolean | undefined>(undefined)
  const [showRentalModal, setShowRentalModal] = useState<boolean>(false)
  const [tokenData, setTokenData] = useState<TokenData | undefined>(undefined)

  return (
    <RentalModalContext.Provider
      value={{
        show: (wallet, connection, cluster, tokenData, dev) => {
          setWallet(wallet)
          setConnection(connection)
          setCluster(cluster)
          setTokenData(tokenData)
          setDev(dev)
          setShowRentalModal(true)
        },
        tokenData,
        showRentalModal,
      }}
    >
      <Modal
        isOpen={showRentalModal}
        onDismiss={() => setShowRentalModal(false)}
        darkenOverlay={true}
      >
        {wallet && connection && (
          <RentalCard
            dev={dev}
            cluster={cluster}
            wallet={wallet}
            connection={connection}
            tokenData={tokenData || {}}
            appName={appName}
            appTwitter={appTwitter}
            onComplete={() => {
              withSleep(() => {
                setShowRentalModal(false)
              }, 1000)
            }}
          />
        )}
      </Modal>
      {children}
    </RentalModalContext.Provider>
  )
}

export const useRentalModal = (): RentalModal => {
  const rentalModalContext = useContext(RentalModalContext)
  if (!rentalModalContext) {
    throw new Error('Not in rentalModalContext context')
  }
  return rentalModalContext
}
