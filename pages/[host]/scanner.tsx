import { utils } from '@project-serum/anchor'
import { Keypair } from '@solana/web3.js'
import { Header } from 'common/Header'
import { StyledBackground } from 'common/StyledBackground'
import { useRecentSignatures } from 'hooks/useRecentSignatures'
import { transparentize } from 'polished'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import React, { useEffect, useMemo, useState } from 'react'
import { FaCheckCircle } from 'react-icons/fa'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'

function Scanner() {
  const { config } = useProjectConfig()
  const [QRCode, setQRCode] = useState()
  const [keypair, setKeypair] = useState<Keypair>(Keypair.generate())
  const [showSuccess, setShowSuccess] = useState(false)
  const recentSignatures = useRecentSignatures(keypair.publicKey)

  const generateQrCode = async () => {
    const { AwesomeQR } = await import('awesome-qr')
    console.log(
      'Generating QR code for request: ',
      `solana:${encodeURIComponent(
        getLink(
          `/api/use?collection=${config.name}&keypair=${utils.bytes.bs58.encode(
            keypair.secretKey
          )}&label=${config.name}`
        )
      )}`
    )
    const qrbuffer = await new AwesomeQR({
      text: `solana:${encodeURIComponent(
        getLink(
          `/api/use?collection=${config.name}&keypair=${utils.bytes.bs58.encode(
            keypair.secretKey
          )}&label=${config.name}`
        )
      )}`,
      colorDark: '#000000',
      colorLight: '#555555',
      backgroundDimming: 'rgba(0, 0, 0, 4)',
      margin: 0,
    }).draw()
    // @ts-ignore
    setQRCode(qrbuffer)
    setKeypair(keypair)
  }

  useMemo(() => {
    if (typeof window !== 'undefined') {
      generateQrCode()
    }
  }, [keypair?.publicKey.toString(), typeof window])

  const recentSignature =
    recentSignatures.data && recentSignatures.data[0]
      ? recentSignatures.data[0].signature
      : ''
  useEffect(() => {
    if (recentSignatures.data && recentSignatures.data?.length > 0) {
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setKeypair(Keypair.generate())
      }, 3000)
    }
  }, [recentSignature])

  return (
    <>
      <Header />
      <div
        style={{
          paddingTop: 'calc(50vh - 220px)',
        }}
        className="relative mx-auto flex w-[93%] max-w-[450px] flex-col items-center text-white"
      >
        {!QRCode ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="flex w-full items-center justify-center px-5">
              <div className="py-3 text-gray-500">
                {keypair?.publicKey.toString()}
              </div>
              <div className="absolute right-0 h-[30px] w-[30px]">
                {/* <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span> */}
                {recentSignatures.refreshing && (
                  <LoadingSpinner height="30px" />
                )}
              </div>
            </div>
            {showSuccess ? (
              <div
                className="flex h-[450px] w-full items-center justify-center rounded-3xl"
                style={{
                  fontSize: '170px',
                  boxShadow: `0 0 80px 50px ${transparentize(
                    0.8,
                    config.colors.secondary
                  )}`,
                }}
              >
                <FaCheckCircle />
              </div>
            ) : (
              <img
                className="w-full rounded-3xl p-3"
                src={QRCode}
                alt="qr-code"
                style={{
                  boxShadow: `0 0 80px 50px ${transparentize(
                    0.8,
                    config.colors.secondary
                  )}`,
                }}
              />
            )}
            <div className="py-3 text-gray-500">
              Ensure you hold a {config.name} NFT in your mobile wallet
            </div>
            <div>
              {recentSignatures.data?.map((sig) => (
                <div key={sig.signature}>{sig.signature}</div>
              ))}
            </div>
          </>
        )}
      </div>
      <StyledBackground colors={config.colors} />
    </>
  )
}

export default Scanner
