import { DisplayAddress } from '@cardinal/namespaces-components'
import { claimLinks, withClaimToken } from '@cardinal/token-manager'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import styled from '@emotion/styled'
import { BN } from '@project-serum/anchor'
import type * as splToken from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import type { Keypair } from '@solana/web3.js'
import { PublicKey, Transaction } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { getTokenData } from 'api/api'
import { handleError } from 'api/errors'
import { getATokenAccountInfo, tryPublicKey } from 'api/utils'
import { withWrapSol } from 'api/wrappedSol'
import { Header } from 'common/Header'
import { LoadingPulse } from 'common/LoadingPulse'
import { NFT } from 'common/NFT'
import { StyledBackground } from 'common/StyledBackground'
import { Tag } from 'common/Tags'
import { executeTransaction } from 'common/Transactions'
import { pubKeyUrl } from 'common/utils'
import { asWallet } from 'common/Wallets'
import {
  getDurationText,
  getSymbolFromTokenData,
  getTokenRentalRate,
  handleCopy,
} from 'components/Browse'
import ClaimQRCode from 'components/ClaimQRCode'
import { usePaymentMints, WRAPPED_SOL_MINT } from 'hooks/usePaymentMints'
import { useRouter } from 'next/router'
import { lighten, transparentize } from 'polished'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { getLink, useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'
import type { ReactElement } from 'react'
import React, { useEffect, useState } from 'react'
import { BiQr } from 'react-icons/bi'
import { FaLink, FaQuestionCircle } from 'react-icons/fa'
import { AsyncButton } from 'rental-components/common/Button'
import { useRentalRateModal } from 'rental-components/RentalRateModalProvider'

type Hideable = {
  visible?: boolean
}

enum VerificationStatus {
  WARNING,
  ERROR,
  SUCCESS,
}

interface Verifiable extends Hideable {
  status?: VerificationStatus
  scanning?: boolean
  colors?: { main: string; secondary: string }
}

const VerificationStep = styled.div<Verifiable>`
  transition: height 0.3s;
  height: ${(props) => (props.visible ? '550px' : '0px')};
  overflow: ${(props) => (props.visible ? 'none' : 'hidden')};
  box-shadow: ${(props) => {
    if (props.visible) {
      switch (props.status) {
        case VerificationStatus.WARNING:
          return '0 0 80px 50px rgba(255, 255, 255, 0.3)'
        case VerificationStatus.ERROR:
          return '0 0 30px 20px rgba(255, 0, 50, 0.3)'
        default:
          return `0 0 80px 50px ${
            props.colors?.secondary
              ? transparentize(0.5, props.colors.secondary)
              : 'rgba(255, 255, 255, 0.3)'
          }`
      }
    }
  }};
`

function Claim() {
  const { config } = useProjectConfig()
  const router = useRouter()
  const { connection, secondaryConnection, environment } = useEnvironmentCtx()
  const wallet = useWallet()
  const rentalRateModal = useRentalRateModal()
  const [error, setError] = useState<ReactElement | null>(null)
  const paymentMintInfos = usePaymentMints()
  const [loadingImage, setLoadingImage] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [otp, setOtp] = useState<Keypair>()
  const [claimed, setClaimed] = useState(false)
  const { UTCNow } = useUTCNow()

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

  const { tokenManagerString, qrcode } = router.query
  const tokenManagerId = tryPublicKey(tokenManagerString)

  async function getMetadata() {
    try {
      setTokenDataError(null)
      setTokenData(null)
      const data = await getTokenData(connection, tokenManagerId!)
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
          connection,
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
    if (router.asPath.includes('otp=')) {
      const split = router.asPath.split('/claim')
      if (split && split[1]) {
        const [_tokenManagerId, otpKeypair] = claimLinks.fromLink(
          getLink(`/claim${split[1].split('&cluster')[0]}`)
        )
        setOtp(otpKeypair)
      }
    }
  }, [router.asPath])

  useEffect(() => {
    if (tokenManagerId) {
      getMetadata()
    }
  }, [connection, tokenManagerString])

  useEffect(() => {
    getUserPaymentTokenAccount()
  }, [connection, wallet.publicKey, tokenData])

  const handleClaim = async () => {
    try {
      setError(null)
      setTokenDataStatus(null)

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
            connection,
            asWallet(wallet),
            amountToWrap.toNumber()
          )
        }
      }
      await withClaimToken(
        transaction,
        secondaryConnection && tokenData?.tokenManager?.parsed.receiptMint
          ? secondaryConnection
          : connection,
        asWallet(wallet),
        tokenManagerId!,
        {
          otpKeypair: otp,
        }
      )
      await executeTransaction(connection, asWallet(wallet), transaction, {
        confirmOptions: { commitment: 'confirmed', maxRetries: 3 },
        signers: otp ? [otp] : [],
        notificationConfig: {},
      })
      setClaimed(true)
    } catch (e: any) {
      setTokenDataStatus({ status: VerificationStatus.ERROR })
      setError(<div>{handleError(e)}</div>)
    } finally {
      getMetadata()
    }
  }

  return (
    <>
      <Header homeButton />
      <div
        style={{
          paddingTop: 'calc(50vh - 400px)',
        }}
        className="flex flex-col"
      >
        <VerificationStep
          visible={true}
          status={tokenDataStatus?.status}
          colors={config.colors}
          className="relative mx-auto flex w-11/12 max-w-[500px] flex-col items-center rounded-xl text-white"
        >
          <div
            className="py-5 text-center"
            style={{
              fontFamily: 'Oswald, sans-serif',
            }}
          >
            <div className="text-[28px] uppercase">Claim Asset</div>
            <div className="font-extralight">
              <a
                href={pubKeyUrl(
                  tokenData?.tokenManager?.parsed.mint,
                  environment.label
                )}
                target="_blank"
                rel="noreferrer"
              >
                {tokenManagerId &&
                  tokenData?.tokenManager?.parsed.mint &&
                  tokenData?.tokenManager?.parsed.mint.toString()}
              </a>
            </div>
          </div>
          <div className="absolute top-[55%] left-1/2 flex h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            {tokenDataStatus === null || !tokenData ? (
              <LoadingPulse loading />
            ) : tokenData && showQRCode ? (
              <ClaimQRCode
                tokenData={tokenData}
                keypair={otp}
                setShowQRCode={setShowQRCode}
              />
            ) : tokenData ? (
              <div
                key={tokenData.tokenManager?.pubkey.toString()}
                className="flex flex-col items-center"
              >
                <NFT
                  key={tokenData?.tokenManager?.pubkey.toBase58()}
                  tokenData={tokenData}
                />
                {
                  {
                    [TokenManagerState.Initialized]: <>Initiliazed</>,
                    [TokenManagerState.Issued]: (
                      <div
                        style={{
                          background: lighten(0.07, config.colors.main),
                        }}
                        className={`flex min-h-[82px] w-[280px] flex-col rounded-b-md p-3`}
                      >
                        <div
                          className="mb-2 flex w-full cursor-pointer flex-row text-xs font-bold text-white"
                          onClick={() =>
                            handleCopy(
                              getLink(
                                `/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
                              )
                            )
                          }
                        >
                          <p className="flex w-fit overflow-hidden text-ellipsis whitespace-nowrap text-left">
                            {tokenData.metadata?.data?.name}
                          </p>
                          <div className="ml-[6px] mt-[2px] flex w-fit">
                            <FaLink />
                          </div>
                        </div>

                        <div className="flex w-full flex-row justify-between text-xs">
                          {tokenData.timeInvalidator?.parsed ||
                          tokenData.useInvalidator?.parsed ? (
                            <Tag state={TokenManagerState.Issued}>
                              <div className="flex flex-col">
                                <div>{getDurationText(tokenData, UTCNow)}</div>
                                <DisplayAddress
                                  connection={secondaryConnection}
                                  address={
                                    tokenData.tokenManager?.parsed.issuer ||
                                    undefined
                                  }
                                  height="18px"
                                  width="100px"
                                  dark={true}
                                />
                              </div>
                            </Tag>
                          ) : (
                            <div className="my-auto rounded-lg bg-gray-800 px-5 py-2 text-white">
                              Private
                            </div>
                          )}
                          {qrcode ? (
                            <AsyncButton
                              bgColor={config.colors.secondary}
                              variant="primary"
                              disabled={!wallet.publicKey}
                              className="my-auto inline-block flex-none text-xs"
                              handleClick={async () => {
                                setShowQRCode(true)
                              }}
                            >
                              <>Scan</>
                              <BiQr />
                            </AsyncButton>
                          ) : (
                            <AsyncButton
                              bgColor={config.colors.secondary}
                              variant="primary"
                              disabled={!wallet.publicKey}
                              className="my-auto inline-block flex-none text-xs"
                              handleClick={async () => {
                                if (wallet.publicKey) {
                                  if (
                                    tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber() ===
                                    0
                                  ) {
                                    rentalRateModal.show(
                                      asWallet(wallet),
                                      connection,
                                      environment.label,
                                      tokenData
                                    )
                                  } else {
                                    await handleClaim()
                                  }
                                }
                              }}
                            >
                              {tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber() ===
                                0 && paymentMintInfos.data ? (
                                <>
                                  {
                                    getTokenRentalRate(
                                      config,
                                      paymentMintInfos.data,
                                      tokenData
                                    )?.displayText
                                  }{' '}
                                </>
                              ) : (
                                <>
                                  Claim{' '}
                                  {(tokenData.claimApprover?.parsed?.paymentAmount.toNumber() ??
                                    0) / 1000000000}{' '}
                                  {getSymbolFromTokenData(tokenData)}{' '}
                                </>
                              )}
                            </AsyncButton>
                          )}
                        </div>
                      </div>
                    ),
                    [TokenManagerState.Claimed]: (
                      <div
                        style={{
                          background: lighten(0.07, config.colors.main),
                        }}
                        className={`flex min-h-[82px] w-[280px] flex-col rounded-b-md p-3`}
                      >
                        <div
                          className="mb-2 flex w-full cursor-pointer flex-row text-xs font-bold text-white"
                          onClick={() =>
                            handleCopy(
                              getLink(
                                `/claim/${tokenData.tokenManager?.pubkey.toBase58()}`
                              )
                            )
                          }
                        >
                          <p className="flex w-fit overflow-hidden text-ellipsis whitespace-nowrap text-left">
                            {tokenData.metadata?.data?.name}
                          </p>
                          <div className="ml-[6px] mt-[2px] flex w-fit">
                            <span className="flex w-full text-left">
                              <FaLink />
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-row justify-between text-xs">
                          {tokenData.recipientTokenAccount?.owner && (
                            <Tag state={TokenManagerState.Claimed}>
                              <div className="flex flex-col">
                                <div className="flex">
                                  <span className="inline-block">
                                    Claimed by&nbsp;
                                  </span>
                                  <DisplayAddress
                                    style={{
                                      color: '#52c41a !important',
                                      display: 'inline',
                                    }}
                                    connection={secondaryConnection}
                                    address={
                                      new PublicKey(
                                        tokenData.recipientTokenAccount?.owner
                                      )
                                    }
                                    height="18px"
                                    width="100px"
                                    dark={true}
                                  />
                                </div>
                                <div className="flex">
                                  <span className="inline-block">
                                    Issued by&nbsp;
                                  </span>
                                  <DisplayAddress
                                    style={{
                                      color: '#52c41a !important',
                                      display: 'inline',
                                    }}
                                    connection={secondaryConnection}
                                    address={
                                      tokenData.tokenManager?.parsed.issuer
                                    }
                                    height="18px"
                                    width="100px"
                                    dark={true}
                                  />
                                </div>
                              </div>
                            </Tag>
                          )}
                        </div>
                      </div>
                    ),
                    [TokenManagerState.Invalidated]: (
                      <Tag state={TokenManagerState.Invalidated}>
                        Invalidated
                      </Tag>
                    ),
                  }[tokenData?.tokenManager?.parsed.state as TokenManagerState]
                }
                {qrcode && (
                  <div className="py-3 px-10 text-center text-xs text-gray-500">
                    Click the scan button to claim this NFT with your mobile
                    wallet and be prepared to present it at the event.
                  </div>
                )}
              </div>
            ) : (
              <>
                <FaQuestionCircle
                  style={{ fontSize: '170px', margin: '0px auto' }}
                />
                {tokenDataError && (
                  <div
                    className="mt-8 text-center font-extralight"
                    style={{
                      fontFamily: 'Oswald, sans-serif',
                    }}
                  >{`${tokenDataError}`}</div>
                )}
              </>
            )}
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
      </div>
      <StyledBackground colors={config.colors} />
    </>
  )
}

export default Claim
