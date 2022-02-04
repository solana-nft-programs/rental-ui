import { useEffect, useState, useCallback } from 'react'
import { PublicKey, Connection } from '@solana/web3.js'
import styled from '@emotion/styled'
import { useWallet } from '@solana/wallet-adapter-react'
import { AwesomeQR } from 'awesome-qr'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { claimLinks } from '@cardinal/token-manager'
import { executeTransaction } from '../../common/Transactions'
import { asWallet } from '../../common/Wallets'
import { TokenData } from 'api/api'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { Wallet } from '@saberhq/solana-contrib'

const BASE_URL = 'https://app.cardinal.so/use/'

export const QRCode = ({
  connection,
  wallet,
  tokenData,
  cluster,
}: {
  connection?: Connection
  wallet?: Wallet
  tokenData?: TokenData
  cluster?: string
}) => {
  const [qrCode, setQrCode] = useState('')
  const getQRCode = useCallback(async () => {
    if (wallet) {
      try {
        const qrbuffer = await new AwesomeQR({
          text: `${BASE_URL}${
            new URLSearchParams(window.location.search).get('cluster')
              ? `&cluster=${new URLSearchParams(window.location.search).get(
                  'cluster'
                )}`
              : ''
          }`,
          colorDark: '#000000',
          colorLight: '#555555',
          backgroundDimming: 'rgba(0, 0, 0, 4)',
          margin: 0,
        }).draw()
        // @ts-ignore
        setQrCode(qrbuffer)
      } catch (e) {
        console.log(e)
      }
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(
      (function getQRCodeInterval(): any {
        getQRCode()
        return getQRCodeInterval
      })(),
      10000
    )
    return () => clearInterval(interval)
  }, [getQRCode])

  if (!wallet) {
    return <div>Connect wallet to scan</div>
  }

  if (!tokenData) {
    return <div>Token not found</div>
  }

  return qrCode ? (
    <QRCodeOuter>
      <img
        height="300px"
        style={{ borderRadius: '10px' }}
        src={qrCode}
        alt="qr-code"
      />
    </QRCodeOuter>
  ) : (
    <LoadingSpinner />
  )
}

const QRCodeOuter = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`
