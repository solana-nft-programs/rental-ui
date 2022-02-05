import React from 'react'
import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { PublicKey } from '@solana/web3.js'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { LoadingPulse, LoadingPulseWrapped } from 'common/LoadingPulse'
import { StyledBackground } from 'common/StyledBackground'
import { useWallet } from '@solana/wallet-adapter-react'
import { Header } from 'common/Header'
import { notify } from 'common/Notification'
import { useRouter } from 'next/router'
import { claimLinks } from '@cardinal/token-manager'
import { asWallet } from 'common/Wallets'
import { getTokenData, TokenData } from 'api/api'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { NFTOverlay } from 'common/NFTOverlay'
import { executeTransaction } from 'common/Transactions'
import { shortPubKey } from 'common/utils'
import { FaQuestionCircle } from 'react-icons/fa'

const BASE_PATH = 'https://app.cardinal.so/claim'

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
    margin-top: 20px;
    display: flex;
    justify-content: center;
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

const NFTOuter = styled.div`
  margin: 0px auto;
  position: relative;
  border-radius: 10px;

  .media {
    border-radius: 10px;
    height: 100%;
  }
`

const tryPublicKey = (
  publicKeyString: string | string[] | undefined
): PublicKey | null => {
  if (!publicKeyString) return null
  try {
    return new PublicKey(publicKeyString)
  } catch (e) {
    return null
  }
}

function Claim() {
  const router = useRouter()
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  const [error, setError] = useState<string | null>(null)
  const [stepNumber, setStepNumber] = useState(0)
  const [loadingClaim, setLoadingClaim] = useState(false)
  const [paymentTokenAccountError, setPaymentTokenAccountError] = useState(null)

  const [loadingImage, setLoadingImage] = useState(false)

  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [tokenDataError, setTokenDataError] = useState<string | null>(null)
  const [tokenDataStatus, setTokenDataStatus] = useState<{
    status: VerificationStatus
    data?: any
  } | null>(null)
  const { mintString } = router.query
  const mintId = tryPublicKey(mintString)

  async function getMetadata() {
    setStepNumber(1)
    try {
      setTokenDataError(null)
      setTokenData(null)
      const data = await getTokenData(ctx.connection, mintId!)
      if (
        !data.metadata &&
        !data.metaplexData &&
        !data.tokenAccount &&
        !data.tokenManager
      ) {
        throw new Error('No token found')
      }
      setTokenData(data)
      console.log(data)

      if (data?.metadata?.data?.image) {
        setLoadingImage(true)
      }
      if (data?.tokenManager?.parsed?.state === TokenManagerState.Claimed) {
        setTokenDataStatus({ status: VerificationStatus.WARNING, data })
      } else {
        setTokenDataStatus({ status: VerificationStatus.SUCCESS, data })
      }
    } catch (e: any) {
      setTokenDataError(e.toString())
      setTokenDataStatus({ status: VerificationStatus.ERROR })
    }
  }

  useEffect(() => {
    if (mintId) {
      getMetadata()
    }
  }, [ctx, setError, setStepNumber, mintString])

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
      setTokenDataStatus(null)
      setLoadingClaim(true)
      const [mintId, otpKeypair] = claimLinks.fromLink(
        `${BASE_PATH}${router.asPath.split('/claim')[1].split('&cluster')[0]}`,
        BASE_PATH
      )
      const transaction = await claimLinks.claimFromLink(
        ctx.connection,
        asWallet(wallet),
        mintId,
        otpKeypair
      )
      const txid = await executeTransaction(
        ctx.connection,
        asWallet(wallet),
        transaction,
        [otpKeypair]
      )
      notify({ message: 'Succesfully claimed!', txid })
      getMetadata()
    } catch (e: any) {
      setTokenDataStatus({ status: VerificationStatus.ERROR })
      handleError(e)
    } finally {
      setLoadingClaim(false)
    }
  }

  console.log(tokenData)
  return (
    <>
      <Header />
      <VerificationStepsOuter>
        <VerificationStep
          visible={stepNumber > 0}
          status={tokenDataStatus?.status}
        >
          <div className="header">
            <div className="step-name">Claim Asset</div>
            {mintId && (
              <div className="addresses">
                <a
                  className="address"
                  href={`https://explorer.solana.com/address/${mintId?.toString()}${
                    ctx.environment.label === 'devnet' ? 'devnet' : ''
                  }`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {mintId?.toString()}
                </a>
              </div>
            )}
          </div>
          <div className="content">
            <LoadingPulseWrapped
              loading={tokenDataStatus === null || loadingImage}
            >
              <>
                {tokenData ? (
                  <>
                    <NFTOuter>
                      <NFTOverlay
                        state={tokenData?.tokenManager?.parsed.state}
                        paymentAmount={
                          tokenData?.tokenManager?.parsed.paymentAmount
                        }
                        paymentMint={
                          tokenData?.tokenManager?.parsed.paymentMint
                        }
                        expiration={tokenData?.tokenManager?.parsed.expiration}
                        usages={tokenData?.tokenManager?.parsed.usages}
                        maxUsages={tokenData?.tokenManager?.parsed.usages}
                        revocable={
                          tokenData?.tokenManager?.parsed.revokeAuthority !=
                          null
                        }
                        extendable={
                          tokenData?.tokenManager?.parsed.isExtendable
                        }
                        returnable={
                          tokenData?.tokenManager?.parsed.isReturnable
                        }
                        lineHeight={14}
                      />
                      {tokenData?.metadata?.data &&
                        (tokenData.metadata.data.animation_url ? (
                          // @ts-ignore
                          <model-viewer
                            className="media"
                            auto-rotate-delay="0"
                            auto-rotate="true"
                            auto-play="true"
                            src={tokenData.metadata.data.animation_url}
                            arStatus="not-presenting"
                            // @ts-ignore
                          ></model-viewer>
                        ) : (
                          <img
                            className="media"
                            src={tokenData.metadata.data.image}
                            alt={tokenData.metadata.data.name}
                            onLoad={() => setLoadingImage(false)}
                          />
                        ))}
                    </NFTOuter>
                    <div className="footer">
                      {tokenData.tokenManager?.parsed.state ===
                      TokenManagerState.Claimed ? (
                        <>
                          Claimed by{' '}
                          <a
                            style={{ paddingLeft: '3px' }}
                            href={`https://explorer.solana.com/address${tokenData.tokenManager?.parsed.recipientTokenAccount}`}
                          >
                            {shortPubKey(
                              tokenData.tokenManager?.parsed
                                .recipientTokenAccount
                            )}
                          </a>
                        </>
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
                ) : (
                  <>
                    <FaQuestionCircle style={{ fontSize: '170px' }} />
                    {tokenDataError && (
                      <div className="footer" style={{ marginTop: '25px' }}>
                        {`${tokenDataError}`}
                      </div>
                    )}
                  </>
                )}
              </>
            </LoadingPulseWrapped>
          </div>
        </VerificationStep>
        <div
          style={{
            width: '50%',
            margin: '40px auto',
            textAlign: 'center',
            color: 'white',
          }}
        >
          {error}
        </div>
      </VerificationStepsOuter>
      <StyledBackground />
    </>
  )
}

export default Claim
