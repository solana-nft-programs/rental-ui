import React, { useEffect, useState } from 'react'
import * as anchor from '@project-serum/anchor'
import styled from '@emotion/styled'
import { DatePicker, InputNumber, Select } from 'antd'
import { Connection, PublicKey } from '@solana/web3.js'
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
import { claimLinks, issueToken } from '@cardinal/token-manager'
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
import { usePaymentMints } from 'providers/PaymentMintsProvider'
const { Option } = Select

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

export const RentalCard = ({
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
  const [price, setPrice] = useState(0)
  const [paymentMint, setPaymentMint] = useState(PAYMENT_MINTS[0].mint)
  const [expiration, setExpiration] = useState<number | null>(null)
  const [durationAmount, setDurationAmount] = useState<number | null>(null)
  const [durationCategory, setDurationCategory] = useState<string | null>(
    defaultDurationCategory
  )
  const [extensionPaymentAmount, setExtensionPaymentAmount] = useState(0)
  const [extensionPaymentMint, setExtensionPaymentMint] = useState(
    PAYMENT_MINTS[0].mint
  )
  const [extensionDurationAmount, setExtensionDurationAmount] = useState<
    number | null
  >(null)
  const [extensionDurationCategory, setExtensionDurationCategory] = useState<
    string | null
  >(defaultDurationCategory)
  const [extensionMaxExpiration, setExtensionMaxExpiration] = useState<
    number | null
  >(null)
  const [disablePartialExtension, setDisablePartialExtension] = useState<
    boolean | null
  >(null)
  const [maxUsages, setMaxUsages] = useState<number | null>(null)
  const [visibility, setVisibiliy] = useState<'private' | 'public'>('public')

  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false)
  const [showUsages, setShowUsages] = useState(false)
  const [showExpiration, setShowExpiration] = useState(false)
  const [showDuration, setShowDuration] = useState(false)
  const [showExtendDuration, setShowExtendDuration] = useState(false)

  const handleSelection = (value: string) => {
    if (value == 'expiration') {
      if (showDuration) {
        setShowDuration(!showDuration)
      }
      setShowExpiration(!showExpiration)
    } else if (value == 'duration') {
      if (showExpiration) {
        setShowExpiration(!showExpiration)
      }
      if (showDuration) {
        setShowExtendDuration(false)
      }
      setShowDuration(!showDuration)
    }

    setExpiration(null)
    setDurationAmount(null)
    setDurationCategory(defaultDurationCategory)
    nullExtensionProperties()
  }

  const nullExtensionProperties = () => {
    setExtensionPaymentAmount(0)
    setExtensionPaymentMint(PAYMENT_MINTS[0].mint)
    setExtensionDurationAmount(null)
    setExtensionDurationCategory(defaultDurationCategory)
    setExtensionMaxExpiration(null)
  }

  const hasAllExtensionProperties = () => {
    return (
      extensionPaymentAmount &&
      extensionDurationAmount &&
      extensionPaymentMint &&
      extensionDurationCategory
    )
  }

  const handleRental = async () => {
    try {
      if (!tokenAccount) {
        throw 'Token acount not found'
      }
      if (showExtendDuration && !hasAllExtensionProperties()) {
        throw 'Please fill out all extension time and price fields'
      }

      setLoading(true)
      const rentalMint = new PublicKey(
        tokenAccount?.account.data.parsed.info.mint
      )

      const issueParams = {
        claimPayment:
          price && paymentMint
            ? {
                paymentAmount: price,
                paymentMint: new PublicKey(paymentMint),
              }
            : undefined,
        timeInvalidation:
          expiration || (durationAmount && durationCategory)
            ? {
                expiration: expiration || undefined,
                durationSeconds:
                  durationAmount && durationCategory
                    ? durationAmount * durationData[durationCategory]
                    : undefined,
                extension: hasAllExtensionProperties()
                  ? {
                      extensionPaymentAmount: extensionPaymentAmount,
                      extensionDurationSeconds:
                        extensionDurationAmount! *
                        durationData[extensionDurationCategory!],
                      paymentMint: new PublicKey(extensionPaymentMint),
                      maxExpiration: extensionMaxExpiration
                        ? extensionMaxExpiration
                        : undefined,
                      disablePartialExtension: disablePartialExtension
                        ? disablePartialExtension
                        : undefined,
                    }
                  : undefined,
              }
            : undefined,
        usages: maxUsages || undefined,
        mint: rentalMint,
        issuerTokenAccountId: tokenAccount?.pubkey,
        kind:
          editionInfo.edition || editionInfo.masterEdition
            ? TokenManagerKind.Edition
            : TokenManagerKind.Managed,
        invalidationType,
        visibility,
      }

      const [transaction, tokenManagerId, otpKeypair] = await issueToken(
        connection,
        wallet,
        issueParams
      )
      await executeTransaction(connection, wallet, transaction, {
        silent: false,
        callback: refreshTokenAccounts,
      })
      const link = claimLinks.getLink(
        tokenManagerId,
        otpKeypair,
        cluster,
        `${process.env.BASE_URL}/claim`
      )
      setLink(link)
      handleCopy(link)
      console.log(link)
    } catch (e) {
      console.log('Error handling rental', e)
      setError(`Error handling rental: ${formatError(`${e}`)}`)
    } finally {
      setLoading(false)
    }
  }
  console.log(paymentMint, price)
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
              paymentAmount={price || undefined}
              paymentMint={paymentMint || undefined}
              expiration={expiration || undefined}
              usages={maxUsages ? 0 : undefined}
              maxUsages={maxUsages || undefined}
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
          <div className="flex justify-center">
            <div className="mr-4 flex">
              <input
                className="my-auto mr-1"
                type="checkbox"
                checked={showUsages}
                onClick={() => setShowUsages(!showUsages)}
              />
              <span className="">Add Usages</span>
            </div>
            <div className="mr-4 flex">
              <input
                className="my-auto mr-1"
                type="checkbox"
                checked={showExpiration}
                onClick={() => handleSelection('expiration')}
              />
              <span className="">Add Expiration</span>
            </div>
            <div className="mr-4 flex">
              <input
                className="my-auto mr-1"
                type="checkbox"
                checked={showDuration}
                onClick={() => handleSelection('duration')}
              />
              <span className="">Add Duration</span>
            </div>
            <div className="mr-4 flex">
              <input
                disabled={showExpiration}
                className="my-auto mr-1"
                type="checkbox"
                checked={showDuration && showExtendDuration}
                onClick={() => {
                  setShowExtendDuration(!showExtendDuration)
                  setShowDuration(true)
                }}
              />
              <span className="">
                {showExpiration ? (
                  <del>Extend Duration</del>
                ) : (
                  'Extend Duration'
                )}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StepDetail
              icon={<ImPriceTags />}
              title="Rental Price"
              description={
                <>
                  <MintPriceSelector
                    disabled={visibility === 'private'}
                    price={price}
                    mint={paymentMint}
                    handlePrice={setPrice}
                    handleMint={setPaymentMint}
                  />
                </>
              }
            />
            {showUsages ? (
              <StepDetail
                icon={<BiQrScan />}
                title="Uses"
                description={
                  <Fieldset>
                    <InputBorder>
                      <Input
                        name="tweet"
                        type="number"
                        onChange={(e) => setMaxUsages(parseInt(e.target.value))}
                      />
                    </InputBorder>
                  </Fieldset>
                }
              />
            ) : null}
            {showExpiration ? (
              <StepDetail
                icon={<BiTimer />}
                title="Expiration"
                description={
                  <div>
                    <DatePicker
                      style={{
                        borderRadius: '4px',
                        zIndex: 99999,
                      }}
                      showTime
                      onChange={(e) =>
                        setExpiration(e ? e.valueOf() / 1000 : null)
                      }
                    />
                  </div>
                }
              />
            ) : null}

            {showDuration ? (
              <StepDetail
                icon={<BiTimer />}
                title="Rental Duration"
                description={
                  <div>
                    <div className="flex gap-3 align-middle ">
                      <InputNumber
                        style={{ width: '100%' }}
                        placeholder="# of..."
                        min="0"
                        step={1}
                        onChange={(e) => setDurationAmount(parseInt(e))}
                      />
                      <Select
                        className="w-max"
                        onChange={(e) => setDurationCategory(e)}
                        defaultValue={defaultDurationCategory}
                      >
                        {Object.keys(durationData).map((category) => (
                          <Option key={category} value={category}>
                            {durationAmount && durationAmount == 1
                              ? category.substring(0, category.length - 1)
                              : category}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </div>
                }
              />
            ) : null}
            {showDuration && showExtendDuration ? (
              <>
                <StepDetail
                  icon={<ImPriceTags />}
                  title="Extension Price"
                  description={
                    <>
                      <MintPriceSelector
                        disabled={visibility === 'private'}
                        price={extensionPaymentAmount}
                        mint={extensionPaymentMint}
                        handlePrice={setExtensionPaymentAmount}
                        handleMint={setExtensionPaymentMint}
                      />
                    </>
                  }
                />
                <StepDetail
                  icon={<BiTimer />}
                  title="Extension Duration"
                  description={
                    <div>
                      <div className="flex gap-3 align-middle ">
                        <InputNumber
                          style={{ width: '100%' }}
                          placeholder="# of..."
                          min="0"
                          step={1}
                          onChange={(e) =>
                            setExtensionDurationAmount(parseInt(e))
                          }
                        />
                        <Select
                          className="w-max"
                          onChange={(e) => setExtensionDurationCategory(e)}
                          defaultValue={defaultDurationCategory}
                        >
                          {Object.keys(durationData).map((category) => (
                            <Option key={category} value={category}>
                              {durationAmount && durationAmount == 1
                                ? category.substring(0, category.length - 1)
                                : category}
                            </Option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  }
                />
              </>
            ) : null}
            {/* {showDuration && showExtendDuration ? (
              
            ) : null} */}
            {showDuration && showExtendDuration ? (
              <StepDetail
                icon={<BiTimer />}
                title="Max Expiration"
                description={
                  <div>
                    <DatePicker
                      style={{
                        borderRadius: '4px',
                        zIndex: 99999,
                      }}
                      showTime
                      onChange={(e) =>
                        setExtensionMaxExpiration(e ? e.valueOf() / 1000 : null)
                      }
                    />
                  </div>
                }
              />
            ) : null}
            {showDuration && showExtendDuration ? (
              <div className="mt-1">
                <input
                  className="my-auto inline-block"
                  type="checkbox"
                  checked={disablePartialExtension || false}
                  onClick={() =>
                    setDisablePartialExtension(!disablePartialExtension)
                  }
                />
                <p className="mb-1 ml-3 inline-block text-[14px] font-bold text-black">
                  Disable Partial Extension
                </p>
                <p className="mb-2 ml-6 inline-block text-[12px] text-gray-700">
                  If selected, rental extensions must occur in multiples of the
                  extension duration.
                </p>
              </div>
            ) : null}
          </div>
          <div>
            <button
              className="mb-2 text-blue-500"
              onClick={() => setShowAdditionalOptions(!showAdditionalOptions)}
            >
              {showAdditionalOptions ? 'Hide' : 'Show'} Additional Options
            </button>
            {showAdditionalOptions ? (
              <div className="flex justify-center">
                <StepDetail
                  icon={<GrReturn />}
                  title="Invalidation"
                  description={
                    <Select
                      style={{ width: '100%' }}
                      onChange={(e) => setInvalidationType(e)}
                      defaultValue={invalidationType}
                    >
                      {[
                        {
                          type: InvalidationType.Return,
                          label: 'Return',
                        },
                        {
                          type: InvalidationType.Invalidate,
                          label: 'Invalidate',
                        },
                      ].map(({ label, type }) => (
                        <Option key={type} value={type}>
                          {label}
                        </Option>
                      ))}
                    </Select>
                  }
                />
                <StepDetail
                  icon={<FaEye />}
                  title="Visibility"
                  description={
                    <Select
                      style={{ width: '100%' }}
                      onChange={(e) => setVisibiliy(e)}
                      defaultValue={visibility}
                    >
                      {[
                        {
                          type: 'public',
                          label: 'Public',
                        },
                        {
                          type: 'private',
                          label: 'Private',
                        },
                      ].map(({ label, type }) => (
                        <Option key={type} value={type}>
                          {label}
                        </Option>
                      ))}
                    </Select>
                  }
                />
              </div>
            ) : null}
          </div>
        </DetailsWrapper>
        <ButtonWithFooter
          loading={loading}
          complete={false}
          message={
            link ? (
              <StyledAlert>
                <Alert
                  style={{
                    height: 'auto',
                    cursor: 'pointer',
                  }}
                  message={
                    <>
                      <div>
                        Link created {link.substring(0, 20)}
                        ...
                        {link.substring(link.length - 5)}
                        <div>
                          This link can only be used once and cannot be
                          regenerated
                        </div>
                      </div>
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
                      <div>
                        Whoever claims this rental will own the asset{' '}
                        {maxUsages && expiration
                          ? `for either ${maxUsages} uses or until ${longDateString(
                              expiration
                            )} and then it will be ${
                              invalidationType === InvalidationType.Return
                                ? 'securely returned to you.'
                                : 'invalid forever..'
                            }`
                          : maxUsages
                          ? `for ${maxUsages} uses and then it will be ${
                              invalidationType === InvalidationType.Return
                                ? 'securely returned to you.'
                                : 'invalid forever'
                            }`
                          : expiration
                          ? `until ${longDateString(
                              expiration
                            )} and then it will be ${
                              invalidationType === InvalidationType.Return
                                ? 'securely returned to you.'
                                : 'invalid forever.'
                            }`
                          : durationAmount && durationCategory
                          ? `
                            for ${durationAmount} ${
                              durationAmount !== 1
                                ? durationCategory.toLocaleLowerCase()
                                : durationCategory
                                    .toLocaleLowerCase()
                                    .substring(0, durationCategory.length - 1)
                            } and then it will be ${
                              invalidationType === InvalidationType.Return
                                ? 'securely returned to you.'
                                : 'invalid forever.'
                            }`
                          : 'forever.'}
                        {showExtendDuration &&
                        extensionPaymentAmount &&
                        extensionDurationAmount &&
                        extensionPaymentMint
                          ? ` The claimer can choose to extend the rental at the rate of ${fmtMintAmount(
                              paymentMintInfos[extensionPaymentMint.toString()],
                              new anchor.BN(extensionPaymentAmount)
                            )} ${
                              PAYMENT_MINTS.filter(
                                (obj) => obj.mint == extensionPaymentMint
                              )[0].symbol
                            } / ${extensionDurationAmount} ${
                              extensionDurationAmount == 1
                                ? extensionDurationCategory
                                    ?.toLowerCase()
                                    .substring(
                                      0,
                                      extensionDurationCategory.length - 1
                                    )
                                : extensionDurationCategory?.toLowerCase()
                            }${
                              extensionMaxExpiration
                                ? ` up until ${new Date(
                                    extensionMaxExpiration * 1000
                                  ).toLocaleString('en-US')}.`
                                : '.'
                            } `
                          : null}
                      </div>
                    </>
                  }
                  type="info"
                  showIcon
                />
              </StyledAlert>
            )
          }
          onClick={link ? () => handleCopy(link) : handleRental}
          footer={<PoweredByFooter />}
        >
          {link ? (
            <div
              style={{ gap: '5px', fontWeight: '300' }}
              className="flex items-center justify-center"
            >
              <FaLink />
              {link.substring(0, 40)}
              ...
              {link.substring(link.length - 10)}
            </div>
          ) : (
            <div
              style={{ gap: '5px' }}
              className="flex items-center justify-center"
            >
              Send {visibility} link
              <FiSend />
            </div>
          )}
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
