import type { Wallet } from '@saberhq/solana-contrib'
import type { Connection } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { Modal } from 'common/Modal'
import React, { useContext, useState } from 'react'

import { QRCode } from './common/QRCode'

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
  const [showQRCode, setShowQRCode] = useState<boolean>(false)
  const [tokenData, setTokenData] = useState<TokenData | undefined>(undefined)

  return (
    <QRCodeContext.Provider
      value={{
        show: (connection, wallet, tokenData, cluster) => {
          setConnection(connection)
          setWallet(wallet)
          setTokenData(tokenData)
          setCluster(cluster)
          setShowQRCode(true)
        },
        tokenData,
        showQRCode,
      }}
    >
      <Modal isOpen={showQRCode} onDismiss={() => setShowQRCode(false)}>
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
