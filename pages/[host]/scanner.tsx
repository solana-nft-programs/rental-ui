import { utils } from '@project-serum/anchor'
import QRCodeStyling from '@solana/qr-code-styling'
import { Keypair } from '@solana/web3.js'
import { AnimatedCheckmark } from 'common/AnimatedCheckmark'
import { Header } from 'common/Header'
import { StyledBackground } from 'common/StyledBackground'
import { useRecentSignatures } from 'hooks/useRecentSignatures'
import { transparentize } from 'polished'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import React, { useEffect, useMemo, useRef, useState } from 'react'

function Scanner() {
  const { config } = useProjectConfig()
  const [QRCode, setQRCode] = useState<QRCodeStyling>()
  const [keypair, setKeypair] = useState<Keypair>(Keypair.generate())
  const [showSuccess, setShowSuccess] = useState(false)
  const recentSignatures = useRecentSignatures(keypair.publicKey)

  const generateQrCode = async () => {
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

    const qrCode = new QRCodeStyling({
      width: 500,
      height: 500,
      type: 'svg',
      data: `solana:${encodeURIComponent(
        getLink(
          `/api/use?collection=${config.name}&keypair=${utils.bytes.bs58.encode(
            keypair.secretKey
          )}&label=${config.name}`
        )
      )}`,
      image: config.logoImage,
      dotsOptions: {
        color: config.colors.secondary,
        type: 'extra-rounded',
      },
      cornersSquareOptions: {
        type: 'extra-rounded',
      },
      backgroundOptions: {
        color: 'none',
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 20,
      },
    })
    setQRCode(qrCode)
    setKeypair(keypair)
  }

  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current && QRCode) {
      ref.current.firstChild && ref.current.removeChild(ref.current.firstChild)
      QRCode.append(ref.current)
    }
  }, [ref, QRCode])

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
      }, 4000)
    }
  }, [recentSignature])

  return (
    <>
      <Header />
      <div
        style={{
          paddingTop: 'calc(50vh - 275px)',
        }}
        className="relative mx-auto flex w-[93%] max-w-[450px] flex-col items-center text-white"
      >
        {!QRCode ? (
          <></>
        ) : (
          <>
            <div className="relative flex w-full flex-row items-center justify-center px-5">
              <div className="py-3 text-gray-500">
                {keypair?.publicKey.toString()}
              </div>
              {recentSignatures.refreshing && (
                <div
                  className="absolute right-0 top-3 h-[10px] w-[10px] animate-ping rounded-full"
                  style={{ background: config.colors.secondary }}
                ></div>
                // <div className="absolute right-4 h-[20px] w-[20px] rounded-full">
                //   <LoadingPulse loading />
                // </div>
              )}
            </div>
            <div className="relative flex h-[350px] w-[350px] items-center justify-center rounded-2xl text-[170px] md:h-[500px] md:w-[500px]">
              {showSuccess && (
                <div
                  className="absolute z-10 flex h-full w-full items-center justify-center rounded-2xl"
                  style={{
                    color: config.colors.secondary,
                    fontSize: '170px',
                    boxShadow: `0 0 80px 50px ${transparentize(
                      0.8,
                      config.colors.secondary
                    )}`,
                  }}
                >
                  <AnimatedCheckmark
                    color={config.colors.secondary}
                    className="h-[200px] w-[200px]"
                  />
                </div>
              )}
              <div
                ref={ref}
                style={{ opacity: showSuccess ? 0.3 : 1, transition: '1s all' }}
                className="scale-[.7] md:scale-100"
              />
            </div>
            <div className="py-3 text-gray-500">
              Ensure you hold a {config.name} NFT in your mobile wallet
            </div>
            {/* <div className="text-gray-500">
              {recentSignatures.data?.map((sig) => (
                <div key={sig.signature}>{sig.signature}</div>
              ))}
            </div> */}
          </>
        )}
      </div>
      <StyledBackground colors={config.colors} />
    </>
  )
}

export default Scanner
