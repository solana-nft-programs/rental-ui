import { Wallet } from '@saberhq/solana-contrib'
import { Connection } from '@solana/web3.js'
import { TokenData } from 'api/api'
import React, { useContext, useState } from 'react'
import QRCode from 'rental-components/common/QRCode'
import { Modal } from './modal'

export const withSleep = async (fn: Function, sleep = 2000) => {
  await new Promise((r) => setTimeout(r, sleep))
  await fn()
}

export interface QRCode {
  show: (
    connection: Connection,
    wallet: Wallet,
    tokenData: TokenData,
    cluster?: string,
    dev?: boolean
  ) => void
  showQRCode: boolean
  tokenData: TokenData | undefined
}

export const QRCodeContext = React.createContext<QRCode | null>(null)

interface Props {
  appName?: string
  appTwitter?: string
  children: React.ReactNode
}

export const QRCodeProvider: React.FC<Props> = ({ children }: Props) => {
  const [wallet, setWallet] = useState<Wallet | undefined>(undefined)
  const [connection, setConnection] = useState<Connection | undefined>(
    undefined
  )
  const [cluster, setCluster] = useState<string | undefined>(undefined)
  const [dev, setDev] = useState<boolean | undefined>(undefined)
  const [showQRCode, setShowQRCode] = useState<boolean>(false)
  const [tokenData, setTokenData] = useState<TokenData | undefined>(undefined)

  return (
    <QRCodeContext.Provider
      value={{
        show: (connection, wallet, tokenData, cluster, dev) => {
          setConnection(connection)
          setWallet(wallet)
          setTokenData(tokenData)
          setCluster(cluster)
          setDev(dev)
          setShowQRCode(true)
        },
        tokenData,
        showQRCode,
      }}
    >
      <Modal
        isOpen={showQRCode}
        onDismiss={() => setShowQRCode(false)}
        darkenOverlay={true}
        topArea={false}
        fitContent={true}
        borderRadius="30px"
        maxWidth="90vw"
        dark={true}
      >
        <QRCode
          connection={connection}
          wallet={wallet}
          cluster={cluster}
          tokenData={tokenData}
        ></QRCode>
      </Modal>
      {children}
    </QRCodeContext.Provider>
  )
}

export const useQRCode = (): QRCode => {
  const qrCodeContext = useContext(QRCodeContext)
  if (!qrCodeContext) {
    throw new Error('Not in QRCodeContext context')
  }
  return qrCodeContext
}
