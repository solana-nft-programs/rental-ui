import { Header } from 'common/Header'
import { StyledBackground } from 'common/StyledBackground'
import { transparentize } from 'polished'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import React, { useEffect, useState } from 'react'
import { QRCodeOuter } from 'rental-components/common/QRCode'

function Scanner() {
  const { config } = useProjectConfig()
  const [QRCode, setQRCode] = useState()

  const generateQrCode = async () => {
    const { AwesomeQR } = await import('awesome-qr')
    console.log(
      'Generating QR code for request: ',
      `solana:${getLink(`/api/use?collection=${config.name}`)}`
    )
    const qrbuffer = await new AwesomeQR({
      text: `solana:${getLink(`/api/use?collection=${config.name}`)}`,
      colorDark: '#000000',
      colorLight: '#555555',
      backgroundDimming: 'rgba(0, 0, 0, 4)',
      margin: 0,
    }).draw()
    // @ts-ignore
    setQRCode(qrbuffer)
  }

  useEffect(() => {
    generateQrCode()
  }, [])

  return (
    <>
      <Header />
      <div
        style={{
          paddingTop: 'calc(50vh - 250px)',
        }}
        className="flex flex-col items-center text-white"
      >
        <div className="mb-5 text-[28px]">
          Scan to verify a {config.name} NFT
        </div>
        <QRCodeOuter>
          <img
            height="300px"
            src={QRCode}
            alt="qr-code"
            style={{
              boxShadow: `0 0 80px 50px ${transparentize(
                0.8,
                config.colors.secondary
              )}`,
            }}
          />
          <div className="disclaimer">
            Ensure you hold the NFT in your mobile wallet
          </div>
        </QRCodeOuter>
      </div>
      <StyledBackground colors={config.colors} />
    </>
  )
}

export default Scanner
