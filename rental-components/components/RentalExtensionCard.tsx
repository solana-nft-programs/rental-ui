import React, { useEffect, useState } from 'react'
import * as anchor from '@project-serum/anchor'
import styled from '@emotion/styled'
import { DatePicker, InputNumber, Select } from 'antd'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { Wallet } from '@saberhq/solana-contrib'
import { ButtonWithFooter } from 'rental-components/common/ButtonWithFooter'
import { Alert } from 'rental-components/common/Alert'
import { StepDetail } from 'rental-components/common/StepDetail'
import {
  Fieldset,
  Input,
  InputBorder,
} from 'rental-components/common/LabeledInput'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'
import { FiSend } from 'react-icons/fi'
import { BiTimer, BiQrScan } from 'react-icons/bi'
import { ImPriceTags } from 'react-icons/im'
import { PAYMENT_MINTS } from 'rental-components/common/Constants'
import { MintPriceSelector } from 'rental-components/common/MintPriceSelector'
import { TokenData } from 'api/api'
import { getQueryParam, longDateString } from 'common/utils'
import { NFTOverlay } from 'common/NFTOverlay'
import {
  claimLinks,
  extendExpiration,
  issueToken,
  withExtendExpiration,
} from '@cardinal/token-manager'
import { executeTransaction } from 'common/Transactions'
import { notify } from 'common/Notification'
import { FaLink, FaEye } from 'react-icons/fa'
import { GrReturn } from 'react-icons/gr'
import {
  InvalidationType,
  TokenManagerKind,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import getEditionInfo, { EditionInfo } from 'api/editions'
import { useUserTokenData } from 'providers/TokenDataProvider'
import { fmtMintAmount } from 'common/units'
import {
  usePaymentMints,
  WRAPPED_SOL_MINT,
} from 'providers/PaymentMintsProvider'
import { withWrapSol } from '@cardinal/token-manager/dist/cjs/wrappedSol'
const { Option } = Select
import * as splToken from '@solana/spl-token'
import { getATokenAccountInfo } from 'api/utils'

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
  notify?: Function
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
  const { refreshTokenAccounts } = useUserTokenData()
  const { tokenAccount, metaplexData, metadata, tokenManager } = tokenData
  const customImageUri = getQueryParam(metadata?.data?.image, 'uri')
  const [invalidationType, setInvalidationType] = useState(
    InvalidationType.Return
  )
  const [userPaymentTokenAccount, setUserPaymentTokenAccount] =
    useState<splToken.AccountInfo | null>(null)
  const [paymentTokenAccountError, setPaymentTokenAccountError] = useState<
    boolean | null
  >(null)
  const [editionInfo, setEditionInfo] = useState<EditionInfo>({})

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

  const durationData: { [key: string]: number } = {
    Minutes: 60,
    Hours: 3600,
    Days: 86400,
    Weeks: 604800,
    Months: 2592000,
    Years: 31104000,
  }

  const defaultDurationCategory = Object.keys(durationData)[2]
  const { paymentMintInfos } = usePaymentMints()

  // form
  // console.log(tokenData.timeInvalidator?.parsed);
  let {
    durationSeconds,
    extensionPaymentAmount,
    paymentMint,
    extensionDurationSeconds,
    maxExpiration,
  } = tokenData.timeInvalidator?.parsed
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [currentExtensionSeconds, setCurrentExtensionSeconds] =
    useState<number>(0)

  const handleExtensionRental = async () => {
    try {
      if (!tokenAccount) {
        throw 'Token acount not found'
      }

      setLoading(true)
      const transaction = new Transaction()
      if (paymentMint.toString() === WRAPPED_SOL_MINT.toString()) {
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
        tokenData.tokenManager?.pubkey!,
        paymentAmount
      )

      await executeTransaction(connection, wallet, transaction, {
        silent: false,
        callback: refreshTokenAccounts,
      })
    } catch (e) {
      console.log('Error handling extension rental', e)
      setError(`Error handling extension rental: ${formatError(`${e}`)}`)
    } finally {
      setLoading(false)
    }
  }

  const secondsToString = (requiredSeconds: number) => {
    if (requiredSeconds == 0) return '0'
    const days = Math.floor(requiredSeconds / 60 / 60 / 24)
    const hours = Math.floor((requiredSeconds / 60 / 60) % 24)
    const minutes = Math.floor((requiredSeconds / 60) % 60)
    const seconds = Math.round(requiredSeconds % 60)

    return `${days ? `${days}d ` : ''}${hours ? `${hours}h ` : ''}${
      minutes ? `${minutes}m ` : ''
    }${seconds ? `${seconds}s` : ''}`
  }

  const handlePaymentAmountChange = (value: number) => {
    setPaymentAmount(value)
    const extensionSeconds = paymentAmountToSeconds(value)
    setCurrentExtensionSeconds(extensionSeconds)
  }

  const paymentAmountToSeconds = (paymentAmount: number) => {
    return (extensionDurationSeconds / extensionPaymentAmount) * paymentAmount
  }

  const loadRate = () => {
    return `${fmtMintAmount(
      paymentMintInfos[paymentMint.toString()],
      new anchor.BN(extensionPaymentAmount)
    )}
    ${
      PAYMENT_MINTS.filter((obj) => obj.mint == paymentMint.toString())[0]
        .symbol
    }
    / ${secondsToString(extensionDurationSeconds)}`
  }

  const exceedMaxExpiration = () => {
    return (
      maxExpiration &&
      maxExpiration <
        tokenData.tokenManager?.parsed.stateChangedAt.toNumber() +
          durationSeconds.toNumber() +
          currentExtensionSeconds
    )
  }

  useEffect(() => {
    getUserPaymentTokenAccount()
  }, [connection, wallet, tokenData])

  async function getUserPaymentTokenAccount() {
    if (wallet.publicKey && tokenData?.tokenManager?.parsed.paymentMint) {
      try {
        const userPaymentTokenAccountData = await getATokenAccountInfo(
          connection,
          tokenData?.tokenManager?.parsed.paymentMint,
          wallet.publicKey
        )
        setUserPaymentTokenAccount(userPaymentTokenAccountData)
      } catch (e) {
        console.log(e)
        if (
          tokenData?.tokenManager?.parsed.paymentMint.toString() !==
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
            <NFTOverlay
              state={tokenManager?.parsed.state}
              paymentAmount={undefined}
              paymentMint={
                tokenData.claimApprover?.parsed?.paymentMint || undefined
              }
              expiration={
                tokenData.timeInvalidator?.parsed?.expiration || undefined
              }
              durationSeconds={
                tokenData.timeInvalidator?.parsed?.durationSeconds.toNumber() ||
                undefined
              }
              stateChangedAt={
                tokenData.tokenManager?.parsed?.stateChangedAt.toNumber() ||
                undefined
              }
              usages={tokenData.useInvalidator?.parsed?.usages ? 0 : undefined}
              maxUsages={
                tokenData.useInvalidator?.parsed?.maxUsages || undefined
              }
              revocable={tokenManager?.parsed.revokeAuthority != null}
              extendable={tokenManager?.parsed.isExtendable}
              returnable={invalidationType === InvalidationType.Return}
              lineHeight={12}
            />
            {metadata &&
              metadata.data &&
              (metadata.data.animation_url ? (
                // @ts-ignore
                <model-viewer
                  className="media"
                  auto-rotate-delay="0"
                  auto-rotate="true"
                  auto-play="true"
                  src={metadata.data.animation_url}
                  arStatus="not-presenting"
                  // @ts-ignore
                ></model-viewer>
              ) : (
                <img
                  className="media"
                  src={customImageUri || metadata.data.image}
                  alt={metadata.data.name}
                />
              ))}
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
                <>
                  <MintPriceSelector
                    price={paymentAmount}
                    handlePrice={handlePaymentAmountChange}
                    mint={paymentMint}
                    handleMint={() => {}}
                    mintDisabled={true}
                  />
                </>
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
              {`${new Date(maxExpiration * 1000).toLocaleString('en-US')}
              `}
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
          disabled={exceedMaxExpiration() || paymentAmount == 0}
          message={
            !exceedMaxExpiration() ? (
              error ? (
                <StyledAlert>
                  <Alert
                    style={{ height: 'auto' }}
                    message={
                      <>
                        <div>{error}</div>
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
                        {paymentAmount !== 0
                          ? `Pay ${fmtMintAmount(
                              paymentMintInfos[paymentMint.toString()],
                              new anchor.BN(paymentAmount)
                            )}
                      ${
                        PAYMENT_MINTS.filter(
                          (obj) => obj.mint == paymentMint.toString()
                        )[0].symbol
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

const BigIcon = styled.div<{ selected: boolean }>`
  font-size: 50px;
  background-color: ${({ selected }) => (selected ? 'black' : '#888')};
  color: white;
  padding: 10px;
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
`

const ButtonWrapper = styled.div`
  display: flex;
  margin-top: 5px;
  justify-content: center;
`

const ButtonLight = styled.div`
  border-radius: 5px;
  padding: 5px 8px;
  border: none;
  background: #eee;
  color: #777;
  cursor: pointer;
  transition: 0.1s all;
  &:hover {
    background: #ddd;
  }
`

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
