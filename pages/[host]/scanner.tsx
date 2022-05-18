import { Header } from 'common/Header'
import { StyledBackground } from 'common/StyledBackground'
import { transparentize } from 'polished'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import React, { useEffect, useState } from 'react'

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
          paddingTop: 'calc(50vh - 220px)',
        }}
        className="relative flex flex-col items-center text-white"
      >
        <img
          height="300px"
          className="rounded-3xl p-3"
          src={QRCode}
          alt="qr-code"
          style={{
            boxShadow: `0 0 80px 50px ${transparentize(
              0.8,
              config.colors.secondary
            )}`,
          }}
        />
        <div className="absolute -bottom-10">
          Ensure you hold a {config.name} NFT in your mobile wallet
        </div>
      </div>
      <StyledBackground colors={config.colors} />
    </>
  )
}

export default Scanner
