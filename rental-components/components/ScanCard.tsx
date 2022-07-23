import { useTransaction } from '@cardinal/token-manager'
import { useWallet } from '@solana/wallet-adapter-react'
import type { TokenData } from 'api/api'
import { QRCode } from 'common/QRCode'
import { asWallet } from 'common/Wallets'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useModal } from 'providers/ModalProvider'
import { getLink } from 'providers/ProjectConfigProvider'
import { useCallback, useEffect, useState } from 'react'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'

type ScanCardProps = { tokenData?: TokenData }

export const ScanCard: React.FC<ScanCardProps> = ({
  tokenData,
}: ScanCardProps) => {
  const wallet = useWallet()
  const { connection } = useEnvironmentCtx()
  const [qrData, setQRData] = useState<string>()
  const [error, setError] = useState<string>()

  const getQRData = useCallback(async () => {
    if (wallet && wallet.signTransaction && wallet.publicKey && connection) {
      try {
        if (!tokenData?.tokenManager) throw new Error('No token manager found')
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const transaction = await useTransaction(
          connection,
          asWallet(wallet),
          tokenData.tokenManager.parsed.mint,
          1
        )
        transaction.feePayer = wallet.publicKey
        transaction.recentBlockhash = (
          await connection.getRecentBlockhash('max')
        ).blockhash
        await wallet.signTransaction(transaction)
        const serializedUsage = transaction.serialize().toString('base64')
        console.log(getLink(`/scan?tx=${encodeURIComponent(serializedUsage)}`))
        setQRData(serializedUsage)
      } catch (e) {
        setError(`${e}`)
      }
    }
  }, [])

  console.log('-11', qrData)

  useEffect(() => {
    const interval = setInterval(
      (function getQRDataInterval() {
        getQRData()
        return getQRDataInterval
      })(),
      10000
    )
    return () => clearInterval(interval)
  }, [getQRData])

  if (!wallet) {
    return <div>Connect wallet to scan</div>
  }

  return (
    <div className="flex h-full min-h-[500px] w-full flex-col items-center justify-center gap-8 rounded-xl bg-dark-6">
      {error ? (
        <div>{error}</div>
      ) : !qrData ? (
        <LoadingSpinner />
      ) : (
        <>
          <QRCode data={qrData} />
          <div className="text-medium-4">
            This is a rotating QR code containing a temporarily valid signed
            transaction
          </div>
        </>
      )}
    </div>
  )
}

export const useScanCard = () => {
  const { showModal } = useModal()
  return {
    showModal: (params: ScanCardProps) => showModal(<ScanCard {...params} />),
  }
}
