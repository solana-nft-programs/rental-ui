import React from 'react'
import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { LoadingPulse, LoadingPulseWrapped } from 'common/LoadingPulse'
import { StyledBackground } from 'common/StyledBackground'
import { useWallet } from '@solana/wallet-adapter-react'
import { Header } from 'common/Header'
import { notify } from 'common/Notification'
import { useError } from 'providers/ErrorProvider'
import { useRouter } from 'next/router'
import { claimLinks } from '@cardinal/token-manager'
import { asWallet } from 'common/Wallets'

type Hideable = {
  visible?: boolean
}

const VerificationStepsOuter = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: calc(50vh - 250px);
  padding-bottom: calc(50vh - 250px);
  width: 90%;
  margin: 0px auto;
  font-weight: 200;
  text-transform: uppercase;
  font-family: Oswald, sans-serif;
`

enum VerificationStatus {
  WARNING,
  ERROR,
  SUCCESS,
}

interface Verifiable extends Hideable {
  status?: VerificationStatus
  scanning?: boolean
}

const VerificationStep = styled.div<Verifiable>`
  text-align: center;
  // background-color: rgba(50,50,50,0.2);
  transition: height 0.3s;
  height: ${(props) => (props.visible ? '500px' : '0px')};
  border-radius: 10px;
  margin: 0px auto;
  width: 90%;
  max-width: 500px;
  box-shadow: ${(props) => {
    if (props.visible) {
      switch (props.status) {
        case VerificationStatus.WARNING:
          return '0 0 30px 20px rgba(255, 200, 50, 0.5)'
        case VerificationStatus.ERROR:
          return '0 0 30px 20px rgba(255, 0, 50, 0.3)'
        default:
          return '0 0 80px 50px rgba(255, 255, 255, 0.3)'
      }
    }
  }};
  color: white;
  position: relative;
  overflow: ${(props) => (props.visible ? 'none' : 'hidden')};

  .header {
    position: relative;
    padding: 15px 28px 0px 28px;
    z-index: 1;
  }

  .step-name {
    font-size: 28px;
    font-weight: 400;
  }

  .address {
    text-decoration: none;
    color: white;
    width: 100%;
    overflow-wrap: break-word;
    transition: 0.2s all;

    &:hover {
      cursor: pointer;
      text-shadow: 0 0 10px #fff;
    }
  }

  .addresses {
    width: 100%;
    max-height: 65px;
    overflow: scroll;
    overflow-wrap: break-word;
  }

  .footer {
  }

  .share-icon {
    font-size: 20px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: transform 0.2s;
    height: 50px;
    width: 50px;
    display: flex;
    margin: 20px auto 0px auto;
    border-radius: 50%;
    align-items: center;
    justify-content: center;

    &:hover {
      transform: scale(1.05);
    }
  }

  .claim-icon {
    font-size: 20px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: transform 0.2s;
    height: 60px;
    width: 60px;
    display: flex;
    margin: 0px auto;
    border-radius: 50%;
    align-items: center;
    justify-content: center;

    &:hover {
      transform: scale(1.05);
    }
  }

  .overlay {
    top: 0;
    transition: 0.5s opacity;
    opacity: ${(props) => (props.scanning ? 1 : 0)};
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgba(200, 200, 200, 0.15);
    border-radius: 10px;
    z-index: ${(props) => (props.scanning ? 2 : 0)};

    .scan-line {
      position: absolute;
      left: 0;
      height: 100%;
      width: 10px;
      background: rgba(255, 255, 255, 0.4);
      box-shadow: 0 0 5px 5px rgba(255, 255, 255, 0.4);
      -webkit-animation: scan 1.5s linear infinite;
      -moz-animation: scan 1.5s linear infinite;
      -o-animation: scan 1.5s linear infinite;
      animation: scan 1.5s linear infinite;
    }

    @keyframes scan {
      0% {
        left: 0;
      }
      50% {
        left: 100%;
      }
      100% {
        left: 0;
      }
    }
  }

  .certificate-overlay {
    bottom: 0;
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      rgba(0, 0, 0, 0.2) 70%,
      rgba(0, 0, 0, 0.4),
      rgba(0, 0, 0, 1) 80%
    );
    border-radius: 10px;
    z-index: 2;
    outline: 6px solid black;

    .data {
      position: absolute;
      bottom: 8px;
      left: 8px;
      text-align: left;
    }

    .logo {
      position: absolute;
      bottom: 8px;
      right: 8px;
      width: 30px;
    }

    .qr-code {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 40px;
      height: 40px;
      font-size: 18px;
      border-radius: 50%;
      background: #000;
      cursor: pointer;
      transition: transform 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        transform: scale(1.05);
      }
    }
  }

  .content {
    position: absolute;
    top: 58%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    &:after {
      content: '';
      display: block;
      padding-bottom: 100%;
    }

    .asset {
      position: relative;
      display: inline-block;
      max-width: 90%;
      min-width: 250px;
      min-height: 250px;
      img {
        width: 100%;
        max-height: 300px;
        border-radius: 10px;
      }
    }
  }

  &:after {
    content: '';
    position: absolute;
    top: -110%;
    left: -210%;
    width: 200%;
    height: 200%;
    opacity: 0;
    transform: rotate(30deg);

    background: rgba(255, 255, 255, 0.13);
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.13) 0%,
      rgba(255, 255, 255, 0.13) 77%,
      rgba(255, 255, 255, 0.5) 92%,
      rgba(255, 255, 255, 0) 100%
    );

    &:hover {
      opacity: 1;
      top: -30%;
      left: -30%;
      transition-property: left, top, opacity;
      transition-duration: 0.7s, 0.7s, 0.15s;
      transition-timing-function: ease;
    }
  }
`

function Scan() {
  const router = useRouter()
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  console.log(router)
  const [error, setError] = useError()
  const [stepNumber, setStepNumber] = useState(0)
  const [loadingClaim, setLoadingClaim] = useState(false)
  const [paymentTokenAccountError, setPaymentTokenAccountError] = useState(null)
  // step 1
  const [metadata, setMetadata] = useState(null)
  const [metadataError, setMetadataError] = useState<Error | null>(null)
  const [metadataStatus, setMetadataStatus] = useState<{
    status: VerificationStatus
    data?: any
  } | null>(null)
  // step 3
  const mintId = null
  const [isModalVisible, setIsModalVisible] = useState(false)

  async function getMetadata() {
    setStepNumber(1)
    try {
      setMetadataError(null)
      setMetadata(null)
      // const data = await api.getCertificateData(
      //   ctx.connection,
      //   new PublicKey(certificateId)
      // )
      // setMetadata(data)
      // if (data?.certificateData?.parsed?.recipient) {
      //   setMetadataStatus({ status: VerificationStatus.WARNING, data })
      // } else {
      //   setMetadataStatus({ status: VerificationStatus.SUCCESS, data })
      // }
    } catch (e: any) {
      console.log(e)
      setMetadataError(e)
      setMetadataStatus({ status: VerificationStatus.ERROR })
    }
  }

  useEffect(() => {
    getMetadata()
  }, [ctx, setError, setStepNumber])

  //   async function getUserPaymentTokenAccount() {
  //     if (
  //       metadata?.certificateData?.parsed.paymentMint &&
  //       wallet.publicKey &&
  //       metadata?.certificateData?.parsed.paymentAmount > 0
  //     ) {
  //       try {
  //         setLoadingClaim(true)
  //         const userPaymentTokenAccount = await api.getATokenAccountInfo(
  //           ctx,
  //           // @ts-ignore
  //           metadata?.certificateData?.parsed.paymentMint,
  //           wallet.publicKey
  //         )
  //       } catch (e) {
  //         console.log(e)
  //         setPaymentTokenAccountError(true)
  //       } finally {
  //         setLoadingClaim(false)
  //       }
  //     }
  //   }

  //   useEffect(() => {
  //     getUserPaymentTokenAccount()
  //   }, [ctx, wallet])

  //   const handleWrap = async () => {
  //     try {
  //       setError(null)
  //       setLoadingClaim(true)
  //       wrapSol(
  //         ctx.connection,
  //         wallet,
  //         metadata.certificateData.parsed.paymentAmount
  //       )
  //     } catch (e) {
  //       handleError(e)
  //     }
  //   }

  const handleError = (e: Error) => {
    console.log(e)
    if (e.message.includes('0x1')) {
      //   setError(
      //     <div>
      //       <div>
      //         User does not have enough balance of{' '}
      //         <a
      //           href={`https://explorer.solana.com/address/${
      //             metadata.certificateData.parsed.paymentMint
      //           }${ctx.environment.label === 'devnet' ? 'devnet' : ''}`}
      //           target="_blank"
      //           rel="noreferrer"
      //         >
      //           mint
      //         </a>
      //       </div>
      //       {metadata.certificateData.parsed.paymentMint.toString() ===
      //       WRAPPED_SOL_MINT.toString() ? (
      //         <Button onClick={() => handleWrap()}>Wrap sol</Button>
      //       ) : (
      //         <a
      //           href={`https://app.saber.so/#/swap?from=So11111111111111111111111111111111111111112&to=${metadata.certificateData.parsed.paymentMint}`}
      //           target="_blank"
      //           rel="noreferrer"
      //         >
      //           <div>Get Funds</div>
      //         </a>
      //       )}
      //     </div>
      //   )
    } else {
      setError(`${e}`)
    }
  }

  const handleClaim = async () => {
    try {
      setError(null)
      setMetadataStatus(null)
      setLoadingClaim(true)
      const [mintId, otpKeypair] = claimLinks.fromLink(window.location.href)
      const txid = await claimLinks.claimFromLink(
        ctx.connection,
        asWallet(wallet),
        mintId,
        otpKeypair
      )
      notify({ message: 'Certificate claimed!', txid: 'k' })
    } catch (e: any) {
      setMetadataStatus({ status: VerificationStatus.ERROR })
      handleError(e)
    } finally {
      setLoadingClaim(false)
    }
  }

  return (
    <>
      <Header />
      <VerificationStepsOuter>
        <VerificationStep
          visible={stepNumber > 0}
          status={metadataStatus?.status}
        >
          <div className="header">
            <div className="step-name">Approved for Claim!</div>
            <div className="addresses">
              <a
                className="address"
                href={`https://explorer.solana.com/address/${mintId}${
                  ctx.environment.label === 'devnet' ? 'devnet' : ''
                }`}
                target="_blank"
                rel="noreferrer"
              >
                {mintId}
              </a>
            </div>
          </div>
          <div className="content">
            <LoadingPulseWrapped loading={metadataStatus === null}>
              <>
                {metadata && (
                  <>
                    <div
                      className="footer"
                      style={{
                        marginTop: '10px',
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      {false ? (
                        <>TEST</>
                      ) : paymentTokenAccountError ? (
                        <div>Error</div>
                      ) : (
                        <div className="claim-icon" onClick={handleClaim}>
                          {loadingClaim ? (
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                position: 'relative',
                              }}
                            >
                              <LoadingPulse loading={loadingClaim} />
                            </div>
                          ) : (
                            'Claim'
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
                {metadataError && (
                  <>
                    <i
                      className="fas fa-question-circle"
                      style={{ fontSize: '170px' }}
                    ></i>
                    <div className="footer" style={{ marginTop: '25px' }}>
                      {`${metadataError}`}
                    </div>
                  </>
                )}
              </>
            </LoadingPulseWrapped>
          </div>
        </VerificationStep>
        <div style={{ width: '50%', margin: '10px auto' }}>{error}</div>
      </VerificationStepsOuter>
      <StyledBackground />
    </>
  )
}

export default Scan
