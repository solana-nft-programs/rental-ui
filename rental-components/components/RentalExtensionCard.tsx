import { withExtendExpiration } from '@cardinal/token-manager'
import { withWrapSol } from '@cardinal/token-manager/dist/cjs/wrappedSol'
import styled from '@emotion/styled'
import * as anchor from '@project-serum/anchor'
import type { Wallet } from '@saberhq/solana-contrib'
import type * as splToken from '@solana/spl-token'
import type { Connection } from '@solana/web3.js'
import { Transaction } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import type { EditionInfo } from 'api/editions'
import getEditionInfo from 'api/editions'
import { getATokenAccountInfo } from 'api/utils'
import { TokenDataOverlay } from 'common/NFTOverlay'
import { notify } from 'common/Notification'
import { executeTransaction } from 'common/Transactions'
import { fmtMintAmount } from 'common/units'
import { getQueryParam, secondsToString } from 'common/utils'
import { usePaymentMints, WRAPPED_SOL_MINT } from 'hooks/usePaymentMints'
import { useUserTokenData } from 'hooks/useUserTokenData'
import React, { useEffect, useState } from 'react'
import { FiSend } from 'react-icons/fi'
import { ImPriceTags } from 'react-icons/im'
import { Alert } from 'rental-components/common/Alert'
import { ButtonWithFooter } from 'rental-components/common/ButtonWithFooter'
import { PAYMENT_MINTS } from 'rental-components/common/Constants'
import { MintPriceSelector } from 'rental-components/common/MintPriceSelector'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'
import { StepDetail } from 'rental-components/common/StepDetail'

const NFTOuter = styled.div`
  margin: 20px auto 0px auto;
  height: 200px;
  position: relative;
  border-radius: 10px;

  .media {
    border-radius: 10px;
    height: 100%;
  }
`

const handleCopy = (shareUrl: string) => {
  navigator.clipboard.writeText(shareUrl)
  notify({ message: 'Share link copied' })
}

function getEditionPill(editionInfo: EditionInfo) {
  const masterEdition = editionInfo.masterEdition
  const edition = editionInfo.edition

  return (
    <div className="ms-2 mx-auto flex justify-center">
      <span className="badge badge-pill bg-dark">{`${
        edition && masterEdition
          ? `Edition ${edition.edition.toNumber()} / ${masterEdition.supply.toNumber()}`
          : masterEdition
          ? 'Master Edition'
          : 'No Master Edition Information'
      }`}</span>
    </div>
  )
}

const formatError = (error: string) => {
  if (error.includes('0x1780')) {
    return 'This mint is not elligible for rent'
  }
  return error
}

export type RentalCardProps = {
  dev?: boolean
  cluster?: string
  connection: Connection
  wallet: Wallet
  tokenData: TokenData
  appName?: string
  appTwitter?: string
  notify?: () => void
  onComplete?: (asrg0: string) => void
}

export const RentalExtensionCard = ({
  appName,
  appTwitter,
  dev,
  cluster,
  connection,
  wallet,
  tokenData,
  notify,
  onComplete,
}: RentalCardProps) => {
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const userTokenData = useUserTokenData()
  const { tokenAccount, metaplexData, metadata, tokenManager } = tokenData
  const customImageUri = getQueryParam(metadata?.data?.image, 'uri')
  const [userPaymentTokenAccount, setUserPaymentTokenAccount] =
    useState<splToken.AccountInfo | null>(null)
  const [paymentTokenAccountError, setPaymentTokenAccountError] = useState<
    boolean | null
  >(null)
  const [editionInfo, setEditionInfo] = useState<EditionInfo>({})
  const [extensionSuccess, setExtensionSuccess] = useState(false)

  const getEdition = async () => {
    try {
      const editionInfo = await getEditionInfo(metaplexData, connection)
      setEditionInfo(editionInfo)
    } catch (e) {
      console.log(e)
    }
  }
  useEffect(() => {
    getEdition()
  }, [metaplexData])

  const paymentMintInfos = usePaymentMints()

  // form
  const {
    extensionPaymentAmount,
    extensionPaymentMint,
    durationSeconds,
    extensionDurationSeconds,
    maxExpiration,
  } = tokenData.timeInvalidator?.parsed || {}

  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [currentExtensionSeconds, setCurrentExtensionSeconds] = useState<
    number | undefined | null
  >(0)

  useEffect(() => {
    getUserPaymentTokenAccount()
  }, [connection, wallet.publicKey, tokenData, getUserPaymentTokenAccount])

  const handleExtensionRental = async () => {
    try {
      setError('')
      setExtensionSuccess(false)
      if (!tokenAccount) throw 'Token acount not found'
      if (!tokenData.tokenManager) throw 'Token manager not found'
      const secondsToAdd = paymentAmountToSeconds(paymentAmount)
      if (!secondsToAdd) throw 'Invalid payment amount'

      setLoading(true)
      const transaction = new Transaction()
      if (extensionPaymentMint?.toString() === WRAPPED_SOL_MINT.toString()) {
        const amountToWrap =
          paymentAmount - (userPaymentTokenAccount?.amount.toNumber() || 0)
        if (amountToWrap > 0) {
          await withWrapSol(transaction, connection, wallet, amountToWrap)
        }
      }

      await withExtendExpiration(
        transaction,
        connection,
        wallet,
        tokenData.tokenManager?.pubkey,
        secondsToAdd
      )

      await executeTransaction(connection, wallet, transaction, {
        silent: false,
        callback: userTokenData.refetch,
      })
      setExtensionSuccess(true)
    } catch (e) {
      setExtensionSuccess(false)
      console.log('Error handling extension rental', e)
      setError(`Error handling extension rental: ${formatError(`${e}`)}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentAmountChange = (value: number) => {
    setPaymentAmount(value)
    const extensionSeconds = paymentAmountToSeconds(value)
    setCurrentExtensionSeconds(extensionSeconds)
  }

  const paymentAmountToSeconds = (paymentAmount: number) => {
    return (
      extensionDurationSeconds &&
      extensionPaymentAmount &&
      (extensionDurationSeconds.toNumber() /
        extensionPaymentAmount.toNumber()) *
        paymentAmount
    )
  }

  if (!extensionPaymentAmount || !extensionPaymentMint || !durationSeconds) {
    return <>Incorrect extension parameters</>
  }

  const loadRate = () => {
    return paymentMintInfos.data
      ? `${fmtMintAmount(
          paymentMintInfos.data[extensionPaymentMint.toString()],
          new anchor.BN(extensionPaymentAmount)
        )}
    ${
      PAYMENT_MINTS.find((obj) => obj.mint === extensionPaymentMint.toString())
        ?.symbol
    }
    / ${secondsToString(extensionDurationSeconds?.toNumber())}`
      : 0
  }

  const exceedMaxExpiration = () => {
    return (
      tokenData.tokenManager &&
      currentExtensionSeconds &&
      maxExpiration &&
      maxExpiration.toNumber() <
        tokenData.tokenManager.parsed.stateChangedAt.toNumber() +
          durationSeconds.toNumber() +
          currentExtensionSeconds
    )
  }

  async function getUserPaymentTokenAccount() {
    if (
      wallet.publicKey &&
      tokenData?.timeInvalidator?.parsed.extensionPaymentMint
    ) {
      try {
        const userPaymentTokenAccountData = await getATokenAccountInfo(
          connection,
          tokenData?.timeInvalidator?.parsed.extensionPaymentMint,
          wallet.publicKey
        )
        setUserPaymentTokenAccount(userPaymentTokenAccountData)
      } catch (e) {
        console.log(e)
        if (
          tokenData?.timeInvalidator?.parsed.extensionPaymentMint.toString() !==
          WRAPPED_SOL_MINT
        ) {
          setPaymentTokenAccountError(true)
        }
      }
    }
  }

  return (
    <RentalCardOuter>
      <Wrapper>
        <Instruction>
          {appName ? `${appName} uses` : 'Use'} Cardinal to rent out this NFT on{' '}
          <strong>Solana</strong>.
        </Instruction>
        {(!wallet?.publicKey || !connection) && (
          <Alert
            style={{ marginBottom: '20px' }}
            message={
              <>
                <div>Connect wallet to continue</div>
              </>
            }
            type="warning"
            showIcon
          />
        )}
        <ImageWrapper>
          <NFTOuter>
            <TokenDataOverlay
              tokenData={tokenData}
              lineHeight={12}
              borderRadius={10}
            />
            {metadata && metadata.data && (
              <img
                className="media"
                src={customImageUri || metadata.data.image}
                alt={metadata.data.name}
              />
            )}
          </NFTOuter>
          {editionInfo && getEditionPill(editionInfo)}
        </ImageWrapper>

        <DetailsWrapper>
          <div className="mx-auto">
            <StepDetail
              icon={<ImPriceTags />}
              title={`Extension Price (${loadRate()})
              `}
              description={
                <MintPriceSelector
                  price={paymentAmount}
                  handlePrice={handlePaymentAmountChange}
                  paymentMintData={PAYMENT_MINTS}
                  mint={extensionPaymentMint?.toString()}
                  handleMint={() => {}}
                  mintDisabled={true}
                />
              }
            />
          </div>

          <div className="mx-auto -mt-3 w-1/2">
            <p className="ml-3 mt-2 text-[14px] text-gray-800">
              <span className="font-bold">Extension Amount: </span>
              {`${secondsToString(currentExtensionSeconds)}
              `}
            </p>
            <p className="ml-3 mt-2 text-[12px] text-gray-800">
              <span className="font-bold ">Max Expiration: </span>
              {maxExpiration
                ? `${new Date(maxExpiration?.toNumber() * 1000).toLocaleString(
                    'en-US'
                  )}
              `
                : 'N/A'}
            </p>
          </div>
        </DetailsWrapper>

        {exceedMaxExpiration() ? (
          <div className="mt-3">
            <StyledAlert>
              <Alert
                style={{ height: 'auto' }}
                message={
                  <>
                    <div>{'Extension amount exceeds max expiration'}</div>
                  </>
                }
                type="error"
                showIcon
              />
            </StyledAlert>
          </div>
        ) : null}

        <ButtonWithFooter
          loading={loading}
          complete={false}
          disabled={exceedMaxExpiration() || paymentAmount === 0}
          message={
            !exceedMaxExpiration() ? (
              extensionSuccess && !error ? (
                <StyledAlert>
                  <Alert
                    style={{
                      height: 'auto',
                      cursor: 'pointer',
                    }}
                    message={
                      <>
                        <div>Duration successfully added to rental.</div>
                      </>
                    }
                    type="success"
                    showIcon
                  />
                </StyledAlert>
              ) : error ? (
                <StyledAlert>
                  <Alert
                    style={{ height: 'auto' }}
                    message={
                      <>
                        <div style={{ wordBreak: 'break-word' }}>{error}</div>
                      </>
                    }
                    type="error"
                    showIcon
                  />
                </StyledAlert>
              ) : (
                <StyledAlert>
                  <Alert
                    style={{ height: 'auto' }}
                    message={
                      <>
                        {paymentAmount !== 0 && paymentMintInfos.data
                          ? `Pay ${fmtMintAmount(
                              paymentMintInfos.data[
                                extensionPaymentMint.toString()
                              ],
                              new anchor.BN(paymentAmount)
                            )}
                      ${
                        PAYMENT_MINTS.find(
                          (obj) => obj.mint === extensionPaymentMint.toString()
                        )?.symbol
                      } to extend the duration of your rental by ${secondsToString(
                              paymentAmountToSeconds(paymentAmount)
                            )}`
                          : `Enter a payment amount to extend the duration of your rental.`}
                      </>
                    }
                    type="info"
                    showIcon
                  />
                </StyledAlert>
              )
            ) : null
          }
          onClick={link ? () => handleCopy(link) : handleExtensionRental}
          footer={<PoweredByFooter />}
        >
          <div
            style={{ gap: '5px' }}
            className="flex items-center justify-center"
          >
            Extend Rental
            <FiSend />
          </div>
        </ButtonWithFooter>
      </Wrapper>
    </RentalCardOuter>
  )
}

const StyledAlert = styled.div`
  width: 100%;
`

const Wrapper = styled.div`
  padding: 10px 28px 28px 28px;
`

const Instruction = styled.h2`
  margin-top: 0px;
  font-weight: normal;
  font-size: 24px;
  line-height: 30px;
  text-align: center;
  letter-spacing: -0.02em;
  color: #000000;
`

const DetailsWrapper = styled.div`
  display: grid;
  grid-row-gap: 28px;
`

const ImageWrapper = styled.div`
  display: grid;
  grid-row-gap: 10px;
  margin-bottom: 20px;
`

export const RentalCardOuter = styled.div``
