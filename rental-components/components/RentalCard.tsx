import React, { useEffect, useState } from 'react'
import * as anchor from '@project-serum/anchor'
import styled from '@emotion/styled'
import { DatePicker, InputNumber, Select } from 'antd'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { Wallet } from '@saberhq/solana-contrib'
import { ButtonWithFooter } from 'rental-components/common/ButtonWithFooter'
import { Alert } from 'rental-components/common/Alert'
import { StepDetail } from 'rental-components/common/StepDetail'
import { Button } from 'rental-components/common/Button'
import axios from 'axios'
import {
  Fieldset,
  Input,
  InputBorder,
} from 'rental-components/common/LabeledInput'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'
import { FiSend } from 'react-icons/fi'
import { BiTimer, BiQrScan } from 'react-icons/bi'
import { GiRobotGrab } from 'react-icons/gi'
import { ImPriceTags } from 'react-icons/im'
import { PAYMENT_MINTS } from 'rental-components/common/Constants'
import { MintPriceSelector } from 'rental-components/common/MintPriceSelector'
import { TokenData } from 'api/api'
import { getQueryParam, longDateString, shortPubKey } from 'common/utils'
import { NFTOverlay } from 'common/NFTOverlay'
import {
  claimLinks,
  IssueParameters,
  issueToken,
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
import { usePaymentMints } from 'providers/PaymentMintsProvider'
import { tryPublicKey } from 'api/utils'
import { useProjectConfigData } from 'providers/ProjectConfigProvider'
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
  notify({ message: 'Notification sent' })
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
  const { tokenAccount, metaplexData, editionData, metadata, tokenManager } =
    tokenData
  const customImageUri = getQueryParam(metadata?.data?.image, 'uri')
  const [invalidationType, setInvalidationType] = useState(
    InvalidationType.Return
  )
  const { rentalCard } = useProjectConfigData()

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

  let durationData: { [key: string]: number } = {
    Minutes: 60,
    Hours: 3600,
    Days: 86400,
    Weeks: 604800,
    Months: 2592000,
    Years: 31104000,
  }

  let invalidationTypes = [
    {
      type: InvalidationType.Return,
      label: 'Return',
    },
    {
      type: InvalidationType.Invalidate,
      label: 'Invalidate',
    },
    {
      type: InvalidationType.Release,
      label: 'Release',
    },
  ]

  let paymentMintData = PAYMENT_MINTS

  const defaultDurationCategory = Object.keys(durationData)[2]!
  const { paymentMintInfos } = usePaymentMints()
  const defaultPaymentMint = paymentMintData[0]!

  // form
  const [price, setPrice] = useState(0)
  const [paymentMint, setPaymentMint] = useState<string>(
    defaultPaymentMint.mint
  )
  const [expiration, setExpiration] = useState<number | null>(null)
  const [durationAmount, setDurationAmount] = useState<number | null>(null)
  const [durationCategory, setDurationCategory] = useState<string | undefined>(
    defaultDurationCategory
  )
  const [extensionPaymentAmount, setExtensionPaymentAmount] = useState(0)
  const [extensionPaymentMint, setExtensionPaymentMint] = useState(
    defaultPaymentMint.mint
  )
  const [extensionDurationAmount, setExtensionDurationAmount] = useState<
    number | null
  >(null)
  const [extensionDurationCategory, setExtensionDurationCategory] =
    useState<string>(defaultDurationCategory)
  const [extensionMaxExpiration, setExtensionMaxExpiration] = useState<
    number | null
  >(null)
  const [disablePartialExtension, setDisablePartialExtension] = useState<
    boolean | null
  >(null)
  const [totalUsages, setTotalUsages] = useState<number | null>(null)
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null)
  const [visibility, setVisibiliy] = useState<'private' | 'public'>('public')
  const [customInvalidator, setCustomInvalidator] = useState<
    string | undefined
  >(undefined)
  const [claimRentalReceipt, setClaimRentalReceipt] = useState(false)

  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false)
  const [showUsages, setShowUsages] = useState(false)
  const [showExpiration, setShowExpiration] = useState(false)
  const [showDuration, setShowDuration] = useState(false)
  const [showExtendDuration, setShowExtendDuration] = useState(false)
  const [showCustom, setShowCustom] = useState(false)

  // Apply Rental Card settings from the project config
  const {
    showUsagesOption,
    showExpirationOption,
    showDurationOption,
    showManualOption,
  } = rentalCard.invalidations

  let showClaimRentalReceipt = true
  if (rentalCard.invalidationOptions?.setClaimRentalReceipt !== undefined) {
    if (
      claimRentalReceipt !==
      rentalCard.invalidationOptions?.setClaimRentalReceipt
    ) {
      setClaimRentalReceipt(
        rentalCard.invalidationOptions?.setClaimRentalReceipt
      )
    }
    showClaimRentalReceipt = false
  }

  if (rentalCard.invalidationOptions) {
    if (rentalCard.invalidationOptions.durationCategories) {
      durationData = Object.keys(durationData)
        .filter((key) =>
          rentalCard.invalidationOptions?.durationCategories?.includes(key)
        )
        .reduce((obj: { [key: string]: number }, key: string) => {
          const d = durationData[key]
          if (d) {
            obj[key] = d
          }
          return obj
        }, {})
    }
    if (rentalCard.invalidationOptions.invalidationCategories) {
      invalidationTypes = invalidationTypes.filter(({ label }) =>
        rentalCard.invalidationOptions?.invalidationCategories?.includes(label)
      )
    }
    if (rentalCard.invalidationOptions.paymentMints) {
      paymentMintData = paymentMintData.filter(({ mint }) =>
        rentalCard.invalidationOptions?.paymentMints?.includes(mint)
      )
    }
  }

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
    setShowCustom(false)
    setExpiration(null)
    setDurationAmount(null)
    setDurationCategory(defaultDurationCategory)
    nullExtensionProperties()
  }

  const nullExtensionProperties = () => {
    setExtensionPaymentAmount(0)
    setExtensionPaymentMint(defaultPaymentMint?.mint)
    setExtensionDurationAmount(null)
    setExtensionDurationCategory(defaultDurationCategory)
    setExtensionMaxExpiration(null)
  }

  const hasAllExtensionProperties = (): boolean => {
    return extensionPaymentAmount &&
      extensionDurationAmount &&
      extensionPaymentMint &&
      extensionDurationCategory
      ? true
      : false
  }

  const handleRental = async () => {
    let extensionPaymentMintPublicKey = tryPublicKey(extensionPaymentMint)
    try {
      if (!tokenAccount) {
        throw 'Token acount not found'
      }
      if (showExtendDuration && !hasAllExtensionProperties()) {
        throw 'Please fill out all extension time and price fields'
      }
      if (!extensionPaymentMintPublicKey) {
        throw 'Invalid payment mint'
      }

      setLoading(true)
      const rentalMint = new PublicKey(
        tokenAccount?.account.data.parsed.info.mint
      )

      const receiptMintKeypair = Keypair.generate()
      const issueParams: IssueParameters = {
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
                    ? durationAmount * (durationData[durationCategory] || 0)
                    : undefined,
                extension: hasAllExtensionProperties()
                  ? {
                      extensionPaymentAmount: extensionPaymentAmount,
                      extensionDurationSeconds:
                        extensionDurationAmount! *
                        (durationData[extensionDurationCategory || 'Minutes'] ||
                          0),
                      extensionPaymentMint: extensionPaymentMintPublicKey,
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
        useInvalidation: totalUsages ? { totalUsages: totalUsages } : undefined,
        mint: rentalMint,
        issuerTokenAccountId: tokenAccount?.pubkey,
        kind:
          editionInfo.edition || editionInfo.masterEdition
            ? TokenManagerKind.Edition
            : TokenManagerKind.Managed,
        invalidationType,
        visibility,
        customInvalidators: customInvalidator
          ? [new PublicKey(customInvalidator)]
          : undefined,
        receiptOptions: claimRentalReceipt ? { receiptMintKeypair } : undefined,
      }

      const [transaction, tokenManagerId, otpKeypair] = await issueToken(
        connection,
        wallet,
        issueParams
      )
      let signers = []
      if (claimRentalReceipt) signers.push(receiptMintKeypair)
      await executeTransaction(connection, wallet, transaction, {
        silent: false,
        callback: refreshTokenAccounts,
        signers,
      })
      const link = claimLinks.getLink(
        tokenManagerId,
        otpKeypair,
        cluster,
        `${process.env.BASE_URL}/claim`
      )
      await axios.post('/api/claims/create', {
        tokenManagerId,
        link,
        email: recipientEmail,
        nftMintId: tokenData?.metaplexData?.data.mint,
      })
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
              durationSeconds={
                durationAmount && durationCategory
                  ? durationAmount * (durationData[durationCategory] || 0)
                  : undefined
              }
              usages={totalUsages ? 0 : undefined}
              totalUsages={totalUsages || undefined}
              extendable={hasAllExtensionProperties()}
              returnable={invalidationType === InvalidationType.Return}
              revocable={customInvalidator ? true : false}
              lineHeight={12}
            />
            {metadata && metadata.data && (
              // (metadata.data.animation_url ? (
              //   // @ts-ignore
              //   <video
              //     className="media"
              //     auto-rotate-delay="0"
              //     auto-rotate="true"
              //     auto-play="true"
              //     src={metadata.data.animation_url}
              //     // arStatus="not-presenting"
              //     // @ts-ignore
              //   ></video>
              // ) : (
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
          <div className="flex justify-center">
            {showUsagesOption ? (
              <div
                className="mr-4 flex cursor-pointer"
                onClick={() => {
                  !showUsages ? setShowCustom(false) : null,
                    setShowUsages(!showUsages)
                }}
              >
                <input
                  className="my-auto mr-1 cursor-pointer"
                  type="checkbox"
                  checked={showUsages}
                />
                <span className="">Usages</span>
              </div>
            ) : null}
            {showExpirationOption ? (
              <div
                className="mr-4 flex cursor-pointer"
                onClick={() => handleSelection('expiration')}
              >
                <input
                  className="my-auto mr-1 cursor-pointer"
                  type="checkbox"
                  checked={showExpiration}
                />
                <span className="">Expiration</span>
              </div>
            ) : null}
            {showDurationOption ? (
              <div
                className="mr-4 flex cursor-pointer"
                onClick={() => handleSelection('duration')}
              >
                <input
                  className="my-auto mr-1 cursor-pointer"
                  type="checkbox"
                  checked={showDuration}
                />
                <span className="">Duration</span>
              </div>
            ) : null}
            {showManualOption ? (
              <div
                className="mr-4 flex cursor-pointer"
                onClick={() => {
                  setShowCustom(!showCustom)
                  setShowDuration(false)
                  setShowExpiration(false)
                  setShowUsages(false)
                }}
              >
                <input
                  className="my-auto mr-1 cursor-pointer"
                  type="checkbox"
                  checked={showCustom}
                />
                <span className="">Manual</span>
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {!showCustom ? (
              <StepDetail
                icon={<ImPriceTags />}
                title="Rental Price"
                description={
                  <MintPriceSelector
                    disabled={visibility === 'private'}
                    price={price}
                    mint={paymentMint}
                    mintDisabled={paymentMintData.length === 1}
                    handlePrice={setPrice}
                    handleMint={setPaymentMint}
                  />
                }
              />
            ) : null}
            {showCustom ? (
              <StepDetail
                icon={<GiRobotGrab />}
                title="Manual Revocation Pubkey"
                description={
                  <div className="flex">
                    <Fieldset>
                      <InputBorder>
                        <Input
                          className="overflow-ellipsis"
                          name="tweet"
                          value={customInvalidator}
                          placeholder={shortPubKey(wallet.publicKey)}
                          onChange={(e) => setCustomInvalidator(e.target.value)}
                        />
                      </InputBorder>
                    </Fieldset>
                    <Button
                      variant={'primary'}
                      className="ml-2 mt-0.5 inline-block flex-none"
                      onClick={() =>
                        setCustomInvalidator(wallet.publicKey.toString())
                      }
                    >
                      {' '}
                      Me{' '}
                    </Button>
                  </div>
                }
              />
            ) : null}
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
                        onChange={(e) =>
                          setTotalUsages(parseInt(e.target.value))
                        }
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
                        className="rounded-[4px]"
                        style={{ width: '100%' }}
                        placeholder="# of..."
                        min="0"
                        step={1}
                        onChange={(e) => setDurationAmount(parseInt(e))}
                      />
                      <Select
                        className="w-max rounded-[4px]"
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
          </div>
          <div>
            {showDuration ? (
              <button
                className="mb-2 text-blue-500"
                onClick={() => setShowExtendDuration(!showExtendDuration)}
              >
                {showExtendDuration ? '[-]' : '[+]'} Extendability
              </button>
            ) : null}
            <div className="grid grid-cols-2 gap-4">
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
                          mintDisabled={paymentMintData.length === 1}
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
                            className="rounded-[4px]"
                            style={{ width: '100%' }}
                            placeholder="# of..."
                            min="0"
                            step={1}
                            onChange={(e) =>
                              setExtensionDurationAmount(parseInt(e))
                            }
                          />
                          <Select
                            className="w-max rounded-[4px]"
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
              {showDuration && showExtendDuration ? (
                <StepDetail
                  icon={<BiTimer />}
                  title="Max Expiration"
                  description={
                    <div>
                      <DatePicker
                        className="rounded-[4px]"
                        style={{
                          zIndex: 99999,
                        }}
                        showTime
                        onChange={(e) =>
                          setExtensionMaxExpiration(
                            e ? e.valueOf() / 1000 : null
                          )
                        }
                      />
                    </div>
                  }
                />
              ) : null}
              {showDuration && showExtendDuration ? (
                <div className="mt-1">
                  <span
                    className="cursor-pointer"
                    onClick={() =>
                      setDisablePartialExtension(!disablePartialExtension)
                    }
                  >
                    <input
                      className="my-auto inline-block cursor-pointer"
                      type="checkbox"
                      checked={disablePartialExtension || false}
                    />
                    <p className="mb-1 ml-3 inline-block text-[14px] font-bold text-black">
                      Disable Partial Extension
                    </p>
                  </span>
                  <p className="mb-2 ml-6 inline-block text-[12px] text-gray-700">
                    If selected, rental extensions must occur in multiples of
                    the extension duration.
                  </p>
                </div>
              ) : null}
              <StepDetail
                icon={<BiQrScan />}
                title="Email"
                description={
                  <Fieldset>
                    <InputBorder>
                      <Input
                        name="email"
                        type="email"
                        onChange={(e) => setRecipientEmail(e.target.value)}
                      />
                    </InputBorder>
                  </Fieldset>
                }
              />
            </div>
            <button
              className="-mt-7 mb-2 text-blue-500"
              onClick={() => setShowAdditionalOptions(!showAdditionalOptions)}
            >
              {showAdditionalOptions ? '[-]' : '[+]'} Additional Options
            </button>
            {showAdditionalOptions ? (
              <div className="grid grid-cols-2 gap-4">
                {invalidationTypes.length !== 1 ? (
                  <StepDetail
                    icon={<GrReturn />}
                    title="Invalidation"
                    description={
                      <Select
                        disabled={invalidationTypes.length === 1}
                        style={{ width: '100%' }}
                        onChange={(e) => setInvalidationType(e)}
                        defaultValue={invalidationType}
                      >
                        {invalidationTypes.map(({ label, type }) => (
                          <Option key={type} value={type}>
                            {label}
                          </Option>
                        ))}
                      </Select>
                    }
                  />
                ) : null}

                <StepDetail
                  icon={<FaEye />}
                  title="Visibility"
                  description={
                    <Select
                      style={{ width: '100%' }}
                      onChange={(e) => {
                        setVisibiliy(e)
                        if (e === 'private') setPrice(0)
                      }}
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

                {showClaimRentalReceipt ? (
                  <div className="mt-1">
                    <span
                      className="cursor-pointer"
                      onClick={() => setClaimRentalReceipt(!claimRentalReceipt)}
                    >
                      <input
                        className="my-auto inline-block cursor-pointer"
                        type="checkbox"
                        checked={claimRentalReceipt}
                      />
                      <p className="mb-1 ml-3 inline-block text-[14px] font-bold text-black">
                        Claim Rental Receipt
                      </p>
                    </span>
                    <p className="mb-2 ml-6 inline-block text-[12px] text-gray-700">
                      If selected, a receipt mint will be generated for the
                      rental. The owner of the receipt mint will act as the
                      issuer.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </DetailsWrapper>
        <ButtonWithFooter
          loading={loading}
          complete={link ? true : false}
          disabled={link ? true : false}
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
                        Notification sent to {recipientEmail}
                        {/* Link created {link.substring(0, 20)}
                        ...
                        {link.substring(link.length - 5)}
                        <div>
                          This link can only be used once and cannot be
                          regenerated
                        </div> */}
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
                        {totalUsages && expiration
                          ? `for either ${totalUsages} uses or until ${longDateString(
                              expiration
                            )} and then it will be ${
                              invalidationType === InvalidationType.Return
                                ? 'securely returned to you.'
                                : invalidationType === InvalidationType.Release
                                ? 'released to whoever claims it.'
                                : 'invalid forever..'
                            }`
                          : totalUsages
                          ? `for ${totalUsages} uses and then it will be ${
                              invalidationType === InvalidationType.Return
                                ? 'securely returned to you.'
                                : invalidationType === InvalidationType.Release
                                ? 'released to whoever claims it.'
                                : 'invalid forever'
                            }`
                          : expiration
                          ? `until ${longDateString(
                              expiration
                            )} and then it will be ${
                              invalidationType === InvalidationType.Return
                                ? 'securely returned to you.'
                                : invalidationType === InvalidationType.Release
                                ? 'released to whoever claims it.'
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
                                : invalidationType === InvalidationType.Release
                                ? 'released to whoever claims it.'
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
                              paymentMintData.find(
                                (obj) => obj.mint == extensionPaymentMint
                              )?.symbol
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
              Notification sent to recipient
              {/* <FaLink />
              {link.substring(0, 40)}
              ...
              {link.substring(link.length - 10)} */}
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
