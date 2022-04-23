import {
  extendExpiration,
  withClaimToken,
  withExtendExpiration,
} from '@cardinal/token-manager'
import { withWrapSol } from '@cardinal/token-manager/dist/cjs/wrappedSol'
import styled from '@emotion/styled'
import * as anchor from '@project-serum/anchor'
import type { Wallet } from '@saberhq/solana-contrib'
import type * as splToken from '@solana/spl-token'
import { Connection } from '@solana/web3.js'
import { Transaction } from '@solana/web3.js'
import { InputNumber, Select } from 'antd'
import { Option } from 'antd/lib/mentions'
import type { TokenData } from 'api/api'
import type { EditionInfo } from 'api/editions'
import getEditionInfo from 'api/editions'
import { getATokenAccountInfo } from 'api/utils'
import { TokenDataOverlay } from 'common/NFTOverlay'
import { notify } from 'common/Notification'
import { executeTransaction } from 'common/Transactions'
import { fmtMintAmount } from 'common/units'
import { capitalizeFirstLetter, getQueryParam } from 'common/utils'
import { ProjectConfig } from 'config/config'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import {
  usePaymentMints,
  WRAPPED_SOL_MINT,
} from 'providers/PaymentMintsProvider'
import { useUserTokenData } from 'providers/TokenDataProvider'
import React, { useEffect, useState } from 'react'
import { AiOutlineMinusCircle, AiOutlinePlusCircle } from 'react-icons/ai'
import { BiTimer } from 'react-icons/bi'
import { FiSend } from 'react-icons/fi'
import { ImPriceTags } from 'react-icons/im'
import { Alert } from 'rental-components/common/Alert'
import { ButtonWithFooter } from 'rental-components/common/ButtonWithFooter'
import { PAYMENT_MINTS } from 'rental-components/common/Constants'
import { MintPriceSelector } from 'rental-components/common/MintPriceSelector'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'
import { StepDetail } from 'rental-components/common/StepDetail'
import {
  DurationOption,
  DURATION_DATA,
  SECONDS_TO_DURATION,
} from './RentalCard'

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
  config?: ProjectConfig
  appName?: string
  appTwitter?: string
  notify?: () => void
  onComplete?: (asrg0: string) => void
}

export const RentalRateCard = ({
  appName,
  connection,
  wallet,
  tokenData,
}: RentalCardProps) => {
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const { tokenAccount, metaplexData, metadata, tokenManager } = tokenData
  const customImageUri = getQueryParam(metadata?.data?.image, 'uri')
  const [userPaymentTokenAccount, setUserPaymentTokenAccount] =
    useState<splToken.AccountInfo | null>(null)
  const [paymentTokenAccountError, setPaymentTokenAccountError] = useState<
    boolean | null
  >(null)
  const [editionInfo, setEditionInfo] = useState<EditionInfo>({})
  const [extensionSuccess, setExtensionSuccess] = useState(false)
  const { environment } = useEnvironmentCtx()

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

  const { paymentMintInfos } = usePaymentMints()

  // form
  const {
    extensionPaymentAmount,
    extensionPaymentMint,
    durationSeconds,
    extensionDurationSeconds,
    maxExpiration,
  } = tokenData.timeInvalidator?.parsed || {}

  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [durationAmount, setDurationAmount] = useState<number>(1)
  const [durationOption, setDurationOption] = useState<DurationOption>(
    SECONDS_TO_DURATION[
      extensionDurationSeconds?.toNumber() ?? 86400
    ] as DurationOption
  )
  const [currentExtensionSeconds, setCurrentExtensionSeconds] = useState<
    number | undefined | null
  >(0)

  useEffect(() => {
    getUserPaymentTokenAccount()
  }, [connection, wallet.publicKey, tokenData, getUserPaymentTokenAccount])

  useEffect(() => {
    const newDuration = durationAmount * DURATION_DATA[durationOption]
    setCurrentExtensionSeconds(newDuration)
    console.log(
      ((extensionPaymentAmount?.toNumber() ?? 0) /
        (extensionDurationSeconds?.toNumber() ?? 0)) *
        newDuration
    )
    setPaymentAmount(
      ((extensionPaymentAmount?.toNumber() ?? 0) /
        (extensionDurationSeconds?.toNumber() ?? 0)) *
        newDuration
    )
  }, [
    durationAmount,
    durationOption,
    extensionPaymentAmount,
    extensionDurationSeconds,
  ])

  const handleRateRental = async () => {
    try {
      setError('')
      setExtensionSuccess(false)
      console.log(tokenData)
      // if (!tokenAccount) throw 'Token acount not found'
      if (!tokenData.tokenManager) throw 'Token manager not found'
      // wrap sol if there is payment required
      const transaction = new Transaction()

      if (
        extensionPaymentMint?.toString() === WRAPPED_SOL_MINT.toString() &&
        paymentAmount > 0
      ) {
        const amountToWrap =
          paymentAmount - (userPaymentTokenAccount?.amount.toNumber() || 0)
        if (amountToWrap > 0) {
          await withWrapSol(transaction, connection, wallet, amountToWrap)
        }
      }

      console.log('Claiming token manager', tokenData)
      await withClaimToken(
        transaction,
        environment.override
          ? new Connection(environment.override)
          : connection,
        wallet,
        tokenData.tokenManager?.pubkey
      )
      await withExtendExpiration(
        transaction,
        connection,
        wallet,
        tokenData.tokenManager?.pubkey,
        paymentAmount
      )
      await executeTransaction(connection, wallet, transaction, {
        confirmOptions: { commitment: 'confirmed', maxRetries: 3 },
        signers: [],
        notificationConfig: {},
      })

      setExtensionSuccess(true)
    } catch (e) {
      setExtensionSuccess(false)
      console.log('Error handling rental', e)
      setError(`Error handling rental: ${formatError(`${e}`)}`)
    } finally {
      setLoading(false)
    }
  }

  const secondsToString = (requiredSeconds: number | undefined | null) => {
    if (!requiredSeconds || requiredSeconds === 0) return '0'
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
    return `${fmtMintAmount(
      paymentMintInfos[extensionPaymentMint.toString()],
      new anchor.BN(extensionPaymentAmount)
    )}
    ${
      PAYMENT_MINTS.find((obj) => obj.mint === extensionPaymentMint.toString())
        ?.symbol
    }
    / ${secondsToString(extensionDurationSeconds?.toNumber())}`
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
          {appName ? `${appName} uses` : 'Use'} Cardinal to rent this NFT on{' '}
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
            <TokenDataOverlay tokenData={tokenData} lineHeight={12} />
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
        <p className="mb-2 flex flex-col gap-4 text-center text-[16px] text-gray-800">
          {/* <span>
            <b>Rate:&nbsp;</b> {loadRate()}
          </span> */}
          <span className="mb-2 text-[13px] text-gray-500">
            <b>Max Rental Duration:&nbsp;</b>{' '}
            {maxExpiration
              ? `${new Date(maxExpiration?.toNumber() * 1000).toLocaleString(
                  'en-US',
                  {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: undefined,
                  }
                )}
              `
              : 'N/A'}
          </span>
        </p>

        <DetailsWrapper>
          <div className="mx-auto">
            <div className="grid grid-cols-2 gap-5">
              <StepDetail
                icon={<BiTimer />}
                title="Rental Duration"
                description={
                  <div>
                    <div className="flex gap-3 align-middle ">
                      <div className="flex">
                        <button
                          className="mr-2"
                          onClick={() =>
                            setDurationAmount(Math.max(0, durationAmount - 1))
                          }
                        >
                          <AiOutlineMinusCircle />
                        </button>
                        <InputNumber
                          className="rounded-[4px]"
                          style={{ width: '100%' }}
                          placeholder="# of..."
                          min="0"
                          step={1}
                          value={`${durationAmount}`}
                          onChange={(e) => setDurationAmount(parseInt(e))}
                        />
                        <button
                          className="ml-2"
                          onClick={() =>
                            setDurationAmount(Math.max(0, durationAmount + 1))
                          }
                        >
                          <AiOutlinePlusCircle />
                        </button>
                      </div>
                      <Select
                        className="w-max rounded-[4px]"
                        onChange={(e) => setDurationOption(e as DurationOption)}
                        defaultValue={durationOption}
                      >
                        {Object.keys(DURATION_DATA).map((option) => (
                          <Option key={option} value={option}>
                            {durationAmount !== undefined && durationAmount > 1
                              ? capitalizeFirstLetter(option)
                              : capitalizeFirstLetter(option).substring(
                                  0,
                                  option.length - 1
                                )}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </div>
                }
              />
              <StepDetail
                icon={<ImPriceTags />}
                title={'Rental Price'}
                description={
                  <MintPriceSelector
                    price={paymentAmount}
                    handlePrice={handlePaymentAmountChange}
                    paymentMintData={PAYMENT_MINTS}
                    mint={extensionPaymentMint?.toString()}
                    handleMint={() => {}}
                    disabled={true}
                    mintDisabled={true}
                  />
                }
              />
            </div>
          </div>

          {/* <div className="mx-auto -mt-3 w-1/2">
            <p className="ml-3 mt-2 text-[14px] text-gray-800">
              <span className="font-bold">Duration of Rental: </span>
              {`${secondsToString(currentExtensionSeconds)}
              `}
            </p>
            <p className="ml-3 mt-2 text-[12px] text-gray-800">
              <span className="font-bold ">Max Duration: </span>
              {maxExpiration
                ? `${new Date(maxExpiration?.toNumber() * 1000).toLocaleString(
                    'en-US'
                  )}
              `
                : 'N/A'}
            </p>
          </div> */}
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
                        <div>NFT successfully rented!</div>
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
                        {paymentAmount !== 0 ||
                        extensionPaymentAmount?.toNumber() === 0
                          ? `Pay ${fmtMintAmount(
                              paymentMintInfos[extensionPaymentMint.toString()],
                              new anchor.BN(paymentAmount)
                            )}
                      ${
                        PAYMENT_MINTS.find(
                          (obj) => obj.mint === extensionPaymentMint.toString()
                        )?.symbol
                      } to rent this NFT for ${secondsToString(
                              currentExtensionSeconds
                            )}`
                          : `Enter a duration to rent this NFT at the specified rate.`}
                      </>
                    }
                    type="info"
                    showIcon
                  />
                </StyledAlert>
              )
            ) : null
          }
          onClick={link ? () => handleCopy(link) : () => handleRateRental()}
          footer={<PoweredByFooter />}
        >
          <div
            style={{ gap: '5px' }}
            className="flex items-center justify-center"
          >
            Rent NFT
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
