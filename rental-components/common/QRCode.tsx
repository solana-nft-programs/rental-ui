import { useEffect, useState, useCallback } from 'react'
import { Connection } from '@solana/web3.js'
import styled from '@emotion/styled'
import { AwesomeQR } from 'awesome-qr'
import { useTransaction } from '@cardinal/token-manager'
import { TokenData } from 'api/api'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'
import { Wallet } from '@saberhq/solana-contrib'
import { getLink } from 'providers/ProjectConfigProvider'
import { useRouter } from 'next/router'

const QRCode = ({
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
  const router = useRouter()
  const [qrCode, setQrCode] = useState<any | null>(null)
  const getQRCode = useCallback(async () => {
    if (wallet && connection) {
      try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const transaction = await useTransaction(
          connection,
          wallet,
          tokenData?.tokenManager?.parsed.mint!,
          1
        )
        transaction.feePayer = wallet.publicKey
        transaction.recentBlockhash = (
          await connection.getRecentBlockhash('max')
        ).blockhash
        await wallet.signTransaction(transaction)
        const serializedUsage = transaction.serialize().toString('base64')
        console.log(getLink(`/scan?tx=${encodeURIComponent(serializedUsage)}`))
        const qrbuffer = await new AwesomeQR({
          text: getLink(`/scan?tx=${encodeURIComponent(serializedUsage)}`),
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
      <img height="300px" src={qrCode} alt="qr-code" />
      <div className="disclaimer">
        This is a rotating QR code containing a temporarily valid signed
        transaction
      </div>
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
  position: relative;

  img {
    border-radius: 30px;
    padding: 10px;
  }

  .disclaimer {
    color: white;
    text-align: center;
    position: absolute;
    bottom: -40px;
  }
`

export default QRCode
