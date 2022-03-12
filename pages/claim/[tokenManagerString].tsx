import React, { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { Transaction } from '@solana/web3.js'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { LoadingPulse, LoadingPulseWrapped } from 'common/LoadingPulse'
import { StyledBackground } from 'common/StyledBackground'
import { useWallet } from '@solana/wallet-adapter-react'
import { Header } from 'common/Header'
import * as splToken from '@solana/spl-token'
import { useRouter } from 'next/router'
import { claimLinks, findAta, withClaimToken } from '@cardinal/token-manager'
import { asWallet } from 'common/Wallets'
import { getTokenData, TokenData } from 'api/api'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { TokenDataOverlay } from 'common/NFTOverlay'
import { executeTransaction } from 'common/Transactions'
import { pubKeyUrl, shortPubKey } from 'common/utils'
import { FaQuestionCircle } from 'react-icons/fa'
import { Button } from 'rental-components/common/Button'
import { PAYMENT_MINTS, WRAPPED_SOL_MINT } from 'providers/PaymentMintsProvider'
import { getATokenAccountInfo, tryPublicKey } from 'api/utils'
import { BN } from '@project-serum/anchor'
import { withWrapSol } from 'api/wrappedSol'

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
  height: ${(props) => (props.visible ? '550px' : '0px')};
  border-radius: 10px;
  margin: 0px auto;
  width: 93%;
  max-width: 500px;
  box-shadow: ${(props) => {
    if (props.visible) {
      switch (props.status) {
        case VerificationStatus.WARNING:
          return '0 0 80px 50px rgba(255, 255, 255, 0.3)'
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
  width: fit-content;
  margin: 0px auto;
  position: relative;
  border-radius: 10px;

  .media {
    border-radius: 10px;
    max-height: 300px;
  }
`

function Claim() {
  const router = useRouter()
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  const [error, setError] = useState<ReactElement | null>(null)
  const [loadingClaim, setLoadingClaim] = useState(false)

  const [loadingImage, setLoadingImage] = useState(false)
  const [claimed, setClaimed] = useState(false)

  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [tokenDataError, setTokenDataError] = useState<string | null>(null)
  const [tokenDataStatus, setTokenDataStatus] = useState<{
    status: VerificationStatus
    data?: TokenData
  } | null>(null)

  const [userPaymentTokenAccount, setUserPaymentTokenAccount] =
    useState<splToken.AccountInfo | null>(null)
  const [paymentTokenAccountError, setPaymentTokenAccountError] = useState<
    boolean | null
  >(null)

  const { tokenManagerString } = router.query
  const tokenManagerId = tryPublicKey(tokenManagerString)
  console.log(tokenData)

  async function getMetadata() {
    try {
      setTokenDataError(null)
      setTokenData(null)
      const data = await getTokenData(ctx.connection, tokenManagerId!)
      if (
        !data.metadata &&
        !data.metaplexData &&
        !data.tokenAccount &&
        !data.tokenManager
      ) {
        throw new Error('No token found')
      }
      setTokenData(data)
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

  async function getUserPaymentTokenAccount() {
    if (wallet.publicKey && tokenData?.claimApprover?.parsed.paymentMint) {
      try {
        const userPaymentTokenAccountData = await getATokenAccountInfo(
          ctx.connection,
          tokenData?.claimApprover?.parsed.paymentMint,
          wallet.publicKey
        )
        setUserPaymentTokenAccount(userPaymentTokenAccountData)
      } catch (e) {
        console.log(e)
        if (
          tokenData?.claimApprover?.parsed.paymentMint.toString() !==
          WRAPPED_SOL_MINT
        ) {
          setPaymentTokenAccountError(true)
        }
      }
    }
  }

  useEffect(() => {
    if (tokenManagerId) {
      getMetadata()
    }
  }, [ctx, setError, tokenManagerString])

  useEffect(() => {
    getUserPaymentTokenAccount()
  }, [ctx, wallet, tokenData])

  const handleError = (e: Error) => {
    if (e.message.includes('0x1')) {
      setError(
        <div className="flex flex-col items-center justify-center">
          <div>
            Insufficient balance of{' '}
            {PAYMENT_MINTS.find(
              ({ mint }) =>
                mint.toString() ===
                tokenData?.claimApprover?.parsed.paymentMint.toString()
            )?.symbol ||
              tokenData?.claimApprover?.parsed.paymentMint.toString()}
            . Check funds and try again
          </div>
          {tokenData?.claimApprover?.parsed.paymentMint.toString() !==
            WRAPPED_SOL_MINT.toString() && (
            <a
              href={`https://app.saber.so/#/swap?from=So11111111111111111111111111111111111111112&to=${tokenData?.claimApprover?.parsed.paymentMint.toString()}`}
              target="_blank"
              rel="noreferrer"
            >
              <div>Get Funds</div>
            </a>
          )}
        </div>
      )
    } else {
      setError(<div>{`${e}`}</div>)
    }
  }

  const handleClaim = async () => {
    try {
      setError(null)
      setTokenDataStatus(null)
      setLoadingClaim(true)

      // get otp if present
      let otp
      if (router.asPath.includes('otp=')) {
        const split = router.asPath.split('/claim')
        if (split && split[1]) {
          const [_tokenManagerId, otpKeypair] = claimLinks.fromLink(
            `${process.env.BASE_URL}/claim${split[1].split('&cluster')[0]}`
          )
          otp = otpKeypair
        }
      }

      // wrap sol if there is payment required
      const transaction = new Transaction()
      if (
        tokenData?.claimApprover?.parsed.paymentAmount &&
        tokenData?.claimApprover.parsed.paymentMint.toString() ===
          WRAPPED_SOL_MINT.toString() &&
        tokenData?.claimApprover.parsed.paymentAmount.gt(new BN(0))
      ) {
        const amountToWrap = tokenData?.claimApprover.parsed.paymentAmount.sub(
          userPaymentTokenAccount?.amount || new BN(0)
        )
        if (amountToWrap.gt(new BN(0))) {
          await withWrapSol(
            transaction,
            ctx.connection,
            asWallet(wallet),
            amountToWrap.toNumber()
          )
        }
      }
      await withClaimToken(
        transaction,
        ctx.connection,
        asWallet(wallet),
        tokenManagerId!,
        {
          otpKeypair: otp,
        }
      )
      await executeTransaction(ctx.connection, asWallet(wallet), transaction, {
        confirmOptions: { commitment: 'confirmed', maxRetries: 3 },
        signers: otp ? [otp] : [],
        notificationConfig: {},
      })
      setClaimed(true)
      getMetadata()
    } catch (e: any) {
      setTokenDataStatus({ status: VerificationStatus.ERROR })
      handleError(e)
    } finally {
      setLoadingClaim(false)
    }
  }

  return (
    <>
      <Header />
      <VerificationStepsOuter>
        <VerificationStep visible={true} status={tokenDataStatus?.status}>
          <div className="header">
            <div className="step-name uppercase">Claim Asset</div>
            {tokenManagerId && tokenData?.tokenManager?.parsed.mint && (
              <div className="addresses">
                <a
                  className="address"
                  href={pubKeyUrl(
                    tokenData?.tokenManager?.parsed.mint,
                    ctx.environment.label
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  {tokenData?.tokenManager?.parsed.mint.toString()}
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
                      <TokenDataOverlay tokenData={tokenData} lineHeight={14} />
                      {tokenData?.metadata?.data &&
                        (tokenData.metadata.data.animation_url ? (
                          // @ts-ignore
                          <video
                            className="media"
                            auto-rotate-delay="0"
                            auto-rotate="true"
                            auto-play="true"
                            src={tokenData.metadata.data.animation_url}
                            // arStatus="not-presenting"
                            // @ts-ignore
                          ></video>
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
                      {(claimed && wallet.publicKey) ||
                      (tokenData.tokenManager?.parsed.state ===
                        TokenManagerState.Claimed &&
                        tokenData.recipientTokenAccount?.owner) ? (
                        <div>
                          <div>
                            Claimed by{' '}
                            <a
                              style={{ paddingLeft: '3px', color: 'blue' }}
                              href={pubKeyUrl(
                                tokenData.recipientTokenAccount?.owner ||
                                  wallet.publicKey,
                                ctx.environment.label
                              )}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {shortPubKey(
                                tokenData.recipientTokenAccount?.owner ||
                                  wallet.publicKey
                              )}
                            </a>
                          </div>
                          <div>
                            This is a cardinal-powered non-transferable NFT
                          </div>
                          <Button
                            className="mx-auto mt-2"
                            variant="primary"
                            onClick={async () => {
                              router.push(
                                `/${
                                  tokenData.recipientTokenAccount?.owner ||
                                  wallet.publicKey
                                }${
                                  ctx.environment.label === 'devnet'
                                    ? `?cluster=devnet`
                                    : ''
                                }`,
                                undefined,
                                {
                                  shallow:
                                    wallet?.publicKey?.toString() ===
                                    tokenData.recipientTokenAccount?.owner.toString(),
                                }
                              )
                            }}
                          >
                            View
                          </Button>
                        </div>
                      ) : paymentTokenAccountError ? (
                        <div>No balance of required payment</div>
                      ) : wallet.connected ? (
                        <div
                          className="claim-icon uppercase"
                          onClick={handleClaim}
                        >
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
                      ) : (
                        <div className="uppercase">Connect wallet to claim</div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <FaQuestionCircle
                      style={{ fontSize: '170px', margin: '0px auto' }}
                    />
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
