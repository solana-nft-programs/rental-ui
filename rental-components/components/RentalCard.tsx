import type { IssueParameters } from '@cardinal/token-manager'
import { claimLinks, issueToken } from '@cardinal/token-manager'
import { findPaymentManagerAddress } from '@cardinal/token-manager/dist/cjs/programs/paymentManager/pda'
import {
  InvalidationType,
  TokenManagerKind,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { css } from '@emotion/react'
import * as anchor from '@project-serum/anchor'
import type { Wallet } from '@saberhq/solana-contrib'
import type { Connection } from '@solana/web3.js'
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import { DatePicker, InputNumber, Select } from 'antd'
import type { TokenData } from 'api/api'
import { executeAllTransactions, tryPublicKey } from 'api/utils'
import { GlyphEdit } from 'assets/GlyphEdit'
import { Button } from 'common/Button'
import { notify } from 'common/Notification'
import { Selector } from 'common/Selector'
import { Switch } from 'common/Switch'
import { Toggle } from 'common/Toggle'
import { Tooltip } from 'common/Tooltip'
import { fmtMintAmount } from 'common/units'
import {
  capitalizeFirstLetter,
  getQueryParam,
  longDateString,
  pubKeyUrl,
  shortDateString,
  shortPubKey,
} from 'common/utils'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useUserTokenData } from 'hooks/useUserTokenData'
import moment from 'moment'
import { lighten } from 'polished'
import { getLink } from 'providers/ProjectConfigProvider'
import { useEffect, useState } from 'react'
import { BiQrScan, BiTimer } from 'react-icons/bi'
import { FaLink } from 'react-icons/fa'
import { FiSend } from 'react-icons/fi'
import { GiRobotGrab } from 'react-icons/gi'
import { ImPriceTags } from 'react-icons/im'
import { IoMdClose } from 'react-icons/io'
import { Alert } from 'rental-components/common/Alert'
import { PAYMENT_MINTS } from 'rental-components/common/Constants'
import {
  Fieldset,
  Input,
  InputBorder,
} from 'rental-components/common/LabeledInput'
import { MintPriceSelector } from 'rental-components/common/MintPriceSelector'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'
import { StepDetail } from 'rental-components/common/StepDetail'

const { Option } = Select

const handleCopy = (shareUrl: string) => {
  navigator.clipboard.writeText(shareUrl)
  notify({ message: 'Share link copied' })
}

export type InvalidatorOption =
  | 'usages'
  | 'expiration'
  | 'duration'
  | 'manual'
  | 'rate'

const VISIBILITY_OPTIONS = ['public', 'private'] as const
export type VisibilityOption = typeof VISIBILITY_OPTIONS[number]

export type InvalidationTypeOption =
  | 'return'
  | 'invalidate'
  | 'release'
  | 'reissue'
const INVALIDATION_TYPES: {
  type: InvalidationType
  label: InvalidationTypeOption
}[] = [
  {
    type: InvalidationType.Return,
    label: 'return',
  },
  {
    type: InvalidationType.Invalidate,
    label: 'invalidate',
  },
  {
    type: InvalidationType.Release,
    label: 'release',
  },
  {
    type: InvalidationType.Reissue,
    label: 'reissue',
  },
]

export type DurationOption =
  | 'minutes'
  | 'hours'
  | 'days'
  | 'weeks'
  | 'months'
  | 'years'
export const DURATION_DATA: { [key in DurationOption]: number } = {
  minutes: 60,
  hours: 3600,
  days: 86400,
  weeks: 604800,
  months: 2419200,
  years: 31449600,
}
export const SECONDS_TO_DURATION: { [key in number]: DurationOption } = {
  60: 'minutes',
  3600: 'hours',
  86400: 'days',
  604800: 'weeks',
  2419200: 'months',
  31449600: 'years',
}

export type RentalCardConfig = {
  invalidators: InvalidatorOption[]
  invalidationOptions?: {
    durationOptions?: DurationOption[]
    invalidationTypes?: InvalidationTypeOption[]
    customInvalidationTypes?: { [address: string]: InvalidationTypeOption[] }
    paymentMints?: string[]
    freezeRentalDuration?: { durationOption?: DurationOption; value?: string }
    freezeRentalRateDuration?: {
      durationOption?: DurationOption
      value?: string
    }
    visibilities?: VisibilityOption[]
    setClaimRentalReceipt?: boolean
    showClaimRentalReceipt?: boolean
    maxDurationAllowed?: { displayText: string; value: number }
  }
  extensionOptions?: {
    setDisablePartialExtension?: boolean
    showDisablePartialExtension?: boolean
  }
  paymentManager?: string
}

export type RentalCardProps = {
  dev?: boolean
  cluster?: string
  connection: Connection
  wallet: Wallet
  tokenDatas: TokenData[]
  appName?: string
  appTwitter?: string
  rentalCardConfig: RentalCardConfig
  notify?: () => void
  onComplete?: (asrg0: string) => void
}

export const RentalCard = ({
  appName,
  cluster,
  connection,
  wallet,
  tokenDatas,
  rentalCardConfig,
}: RentalCardProps) => {
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const userTokenData = useUserTokenData()
  const paymentMintInfos = usePaymentMints()
  const [selectedTokenDatas, setSelectedTokenDatas] =
    useState<TokenData[]>(tokenDatas)
  const [totalTokens, setTotalTokens] = useState(tokenDatas.length)

  if (
    userTokenData.data &&
    selectedTokenDatas.filter((token) =>
      userTokenData.data
        ?.map((t) => t.tokenAccount?.account.data.parsed.info.mint.toString())
        .includes(token.tokenAccount?.account.data.parsed.info.mint.toString())
    ).length !== selectedTokenDatas.length
  ) {
    const filteredTokens = selectedTokenDatas.filter((token) =>
      userTokenData.data
        ?.map((t) => t.tokenAccount?.account.data.parsed.info.mint.toString())
        .includes(token.tokenAccount?.account.data.parsed.info.mint.toString())
    )
    if (filteredTokens.length !== 0) {
      setSelectedTokenDatas(filteredTokens)
    }
  }

  // Pull overrides from config
  const visibilities =
    rentalCardConfig.invalidationOptions?.visibilities || VISIBILITY_OPTIONS

  const invalidationTypes =
    rentalCardConfig.invalidationOptions?.customInvalidationTypes &&
    wallet.publicKey &&
    wallet.publicKey.toString() in
      rentalCardConfig.invalidationOptions.customInvalidationTypes
      ? INVALIDATION_TYPES.filter(({ label }) =>
          rentalCardConfig.invalidationOptions?.customInvalidationTypes?.[
            wallet.publicKey.toString()
          ]?.includes(label)
        )
      : rentalCardConfig.invalidationOptions?.invalidationTypes
      ? INVALIDATION_TYPES.filter(({ label }) =>
          rentalCardConfig.invalidationOptions?.invalidationTypes?.includes(
            label
          )
        )
      : INVALIDATION_TYPES

  const durationData = rentalCardConfig.invalidationOptions?.durationOptions
    ? Object.keys(DURATION_DATA)
        .filter((key) =>
          rentalCardConfig.invalidationOptions?.durationOptions?.includes(
            key as DurationOption
          )
        )
        .reduce((obj: { [key: string]: number }, key: string) => {
          const d = DURATION_DATA[key as DurationOption]
          if (d) {
            obj[key] = d
          }
          return obj
        }, {})
    : DURATION_DATA

  const paymentMintData = rentalCardConfig.invalidationOptions?.paymentMints
    ? PAYMENT_MINTS.filter(({ mint }) =>
        rentalCardConfig.invalidationOptions?.paymentMints?.includes(mint)
      )
    : PAYMENT_MINTS

  // console.log(paymentMintData)

  const showClaimRentalReceipt =
    rentalCardConfig.invalidationOptions?.showClaimRentalReceipt

  // defaults
  const defaultVisibility = visibilities[0]
  const defaultDurationOption =
    rentalCardConfig.invalidationOptions?.freezeRentalDuration
      ?.durationOption || 'days'
  const defaultPaymentMint = paymentMintData[0]!
  const defaultInvalidationType = invalidationTypes[0]!.type
  const defaultDurationAmount =
    rentalCardConfig.invalidationOptions?.freezeRentalDuration?.value || '1'

  // state
  const [price, setPrice] = useState(0)
  const [paymentMint, setPaymentMint] = useState<string>(
    defaultPaymentMint.mint
  )
  const [durationAmount, setDurationAmount] = useState<number | null>(
    parseInt(defaultDurationAmount)
  )
  const [durationOption, setDurationOption] = useState<DurationOption>(
    defaultDurationOption
  )
  const [extensionPaymentAmount, setExtensionPaymentAmount] = useState(0)
  const [extensionPaymentMint, setExtensionPaymentMint] = useState(
    defaultPaymentMint.mint
  )
  const [extensionDurationAmount, setExtensionDurationAmount] = useState<
    number | null
  >(null)
  const [extensionDurationOption, setExtensionDurationOption] =
    useState<DurationOption>(defaultDurationOption)
  const [extensionMaxExpiration, setExtensionMaxExpiration] = useState<
    number | null
  >(
    rentalCardConfig.invalidationOptions?.maxDurationAllowed?.value
      ? Date.now() / 1000 +
          rentalCardConfig.invalidationOptions?.maxDurationAllowed?.value
      : null
  )
  const [disablePartialExtension, setDisablePartialExtension] = useState<
    boolean | null
  >(null)
  const [totalUsages, setTotalUsages] = useState<number | null>(null)
  const [visibility, setVisibiliy] =
    useState<VisibilityOption>(defaultVisibility)
  const [invalidationType, setInvalidationType] = useState(
    defaultInvalidationType
  )
  const [customInvalidator, setCustomInvalidator] = useState<
    string | undefined
  >(undefined)
  const [claimRentalReceipt, setClaimRentalReceipt] = useState(
    rentalCardConfig.invalidationOptions?.setClaimRentalReceipt || false
  )

  const [selectedInvalidators, setSelectedInvalidators] = useState<
    InvalidatorOption[]
  >(rentalCardConfig.invalidators[0] ? [rentalCardConfig.invalidators[0]] : [])
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false)
  const [showExtendDuration, setShowExtendDuration] = useState(false)
  const [confirmRentalTerms, setConfirmRentalTerms] = useState(false)
  const [totalListed, setTotalListed] = useState(0)
  const rateRental = selectedInvalidators.includes('rate')

  // reset
  useEffect(() => {
    if (!selectedInvalidators.includes('duration')) {
      setExtensionDurationAmount(null)
      setExtensionDurationOption(defaultDurationOption)
      setDurationAmount(null)
    }
    if (!selectedInvalidators.includes('expiration')) {
      setExtensionMaxExpiration(null)
    }
    if (!selectedInvalidators.includes('manual')) {
      setCustomInvalidator(undefined)
    }
    if (!selectedInvalidators.includes('usages')) {
      setTotalUsages(null)
    }
    if (!selectedInvalidators.includes('rate')) {
      setExtensionMaxExpiration(null)
      setExtensionDurationAmount(null)
    }
    if (selectedInvalidators.includes('rate')) {
      setExtensionDurationAmount(
        parseInt(
          rentalCardConfig.invalidationOptions?.freezeRentalRateDuration
            ?.value ?? '1'
        )
      )
      setExtensionPaymentMint(defaultPaymentMint.mint)
      setExtensionPaymentAmount(0)
      setDurationAmount(0)
      setExtensionMaxExpiration(
        rentalCardConfig.invalidationOptions?.maxDurationAllowed?.value
          ? Date.now() / 1000 +
              rentalCardConfig.invalidationOptions?.maxDurationAllowed?.value
          : null
      )
    }
  }, [selectedInvalidators])

  const hasAllExtensionProperties = (): boolean => {
    return (extensionPaymentAmount || extensionPaymentAmount === 0) &&
      extensionDurationAmount &&
      extensionPaymentMint &&
      extensionDurationOption
      ? true
      : false
  }

  const extensionRate = () => {
    return `${
      paymentMintInfos.data
        ? fmtMintAmount(
            paymentMintInfos.data[extensionPaymentMint.toString()],
            new anchor.BN(extensionPaymentAmount)
          )
        : 0
    } ${
      paymentMintData.find((obj) => obj.mint === extensionPaymentMint)?.symbol
    } / ${extensionDurationOption
      ?.toLowerCase()
      .substring(0, extensionDurationOption.length - 1)}`
  }

  const handleRental = async () => {
    const extensionPaymentMintPublicKey = tryPublicKey(extensionPaymentMint)
    try {
      if (showExtendDuration && !hasAllExtensionProperties()) {
        throw 'Please fill out all extension time and price fields'
      }
      if (!extensionPaymentMintPublicKey) {
        throw 'Invalid payment mint'
      }
      if (rentalCardConfig.invalidationOptions?.maxDurationAllowed) {
        if (
          durationAmount &&
          durationOption &&
          durationAmount * (durationData[durationOption] || 0) >
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.value
        ) {
          throw (
            'Duration of rental exceeds max allowed. Max duration allowed is ' +
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.displayText
          )
        }
        if (
          extensionMaxExpiration &&
          extensionMaxExpiration - Date.now() >
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.value
        ) {
          throw (
            'Duration of rental exceeds max allowed. Max duration allowed is ' +
            rentalCardConfig.invalidationOptions?.maxDurationAllowed.displayText
          )
        }
      }

      const transactions = []
      const receiptMintKeypairs = []
      const tokenManagerIds = []
      const otpKeypairs = []
      for (let i = 0; i < selectedTokenDatas.length; i = i + 1) {
        const { tokenAccount, editionData } = selectedTokenDatas[i]!
        if (!tokenAccount) {
          throw 'Token acount not found'
        }
        if (!editionData) {
          throw 'Edition info not found'
        }

        setLoading(true)
        const rentalMint = new PublicKey(
          tokenAccount?.account.data.parsed.info.mint
        )
        const receiptMintKeypair = Keypair.generate()
        receiptMintKeypairs.push(receiptMintKeypair)
        const issueParams: IssueParameters = {
          claimPayment:
            price && paymentMint
              ? {
                  paymentAmount: price,
                  paymentMint: new PublicKey(paymentMint),
                  paymentManager: rentalCardConfig.paymentManager
                    ? tryPublicKey(rentalCardConfig.paymentManager) ||
                      new PublicKey(
                        (
                          await findPaymentManagerAddress(
                            rentalCardConfig.paymentManager
                          )
                        )[0]
                      )
                    : undefined,
                }
              : undefined,
          timeInvalidation:
            extensionMaxExpiration ||
            (durationAmount && durationOption) ||
            rateRental
              ? {
                  durationSeconds:
                    (durationAmount || durationAmount === 0) && durationOption
                      ? durationAmount * (durationData[durationOption] || 0)
                      : undefined,
                  maxExpiration: extensionMaxExpiration
                    ? extensionMaxExpiration
                    : undefined,
                  extension: hasAllExtensionProperties()
                    ? {
                        extensionPaymentAmount: extensionPaymentAmount,
                        extensionDurationSeconds:
                          extensionDurationAmount! *
                          (durationData[extensionDurationOption] || 0),
                        extensionPaymentMint: extensionPaymentMintPublicKey,
                        disablePartialExtension: disablePartialExtension
                          ? disablePartialExtension
                          : undefined,
                      }
                    : undefined,
                  paymentManager: rentalCardConfig.paymentManager
                    ? tryPublicKey(rentalCardConfig.paymentManager) ||
                      new PublicKey(
                        (
                          await findPaymentManagerAddress(
                            rentalCardConfig.paymentManager
                          )
                        )[0]
                      )
                    : undefined,
                }
              : undefined,
          useInvalidation: totalUsages
            ? {
                totalUsages: totalUsages,
                paymentManager: rentalCardConfig.paymentManager
                  ? tryPublicKey(rentalCardConfig.paymentManager) ||
                    new PublicKey(
                      (
                        await findPaymentManagerAddress(
                          rentalCardConfig.paymentManager
                        )
                      )[0]
                    )
                  : undefined,
              }
            : undefined,
          mint: rentalMint,
          issuerTokenAccountId: tokenAccount?.pubkey,
          kind: editionData
            ? TokenManagerKind.Edition
            : TokenManagerKind.Managed,
          invalidationType,
          visibility,
          customInvalidators: customInvalidator
            ? [new PublicKey(customInvalidator)]
            : undefined,
          receiptOptions: claimRentalReceipt
            ? { receiptMintKeypair }
            : undefined,
        }

        const [issueTransaction, tokenManagerId, otpKeypair] = await issueToken(
          connection,
          wallet,
          issueParams
        )

        tokenManagerIds.push(tokenManagerId)
        otpKeypairs.push(otpKeypair)

        const transaction = new Transaction()
        transaction.instructions = otpKeypair
          ? [
              ...issueTransaction.instructions,
              SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: otpKeypair.publicKey,
                lamports: 0.001 * LAMPORTS_PER_SOL,
              }),
            ]
          : issueTransaction.instructions
        transactions.push(transaction)
      }
      let totalSuccessfulTransactions = 0
      await executeAllTransactions(connection, wallet, transactions, {
        callback: async (successfulTxs: number) => {
          userTokenData.refetch()
          totalSuccessfulTransactions = successfulTxs
        },
        signers: claimRentalReceipt ? [receiptMintKeypairs] : [],
        confirmOptions: {
          maxRetries: 3,
        },
        notificationConfig: {
          successSummary: true,
          message: 'Successfully rented out NFTs',
          description: 'These NFTs are now available to rent in the browse tab',
        },
      })
      setTotalListed(totalSuccessfulTransactions)
      setTotalTokens(selectedTokenDatas.length)
      if (selectedTokenDatas.length === 1 && tokenManagerIds[0]) {
        const link = claimLinks.getLink(
          tokenManagerIds[0],
          otpKeypairs[0],
          cluster,
          getLink('/claim', false)
        )
        setLink(link)
      } else {
        setLink('success')
      }
    } catch (e) {
      console.log('Error handling rental', e)
      setConfirmRentalTerms(false)
      setError(`${e}`)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="rounded-lg bg-dark-6 p-6">
      <div className="text-center text-xl text-light-0">
        Rent out{' '}
        {tokenDatas.length > 1
          ? `(${tokenDatas.length})`
          : tokenDatas[0]
          ? tokenDatas[0].metadata?.data.name
          : ''}
      </div>
      <div
        className={
          `flex w-full gap-4 overflow-scroll overflow-x-auto py-4 ` +
          (tokenDatas.length <= 2 ? 'justify-center' : '')
        }
      >
        {tokenDatas.map((tokenData, i) => (
          <div
            key={i}
            className="w-1/2 flex-shrink-0 overflow-hidden rounded-lg bg-medium-4"
          >
            {tokenData.metadata && tokenData.metadata.data && (
              <img
                src={
                  getQueryParam(tokenData.metadata?.data?.image, 'uri') ||
                  tokenData.metadata.data.image
                }
                alt={tokenData.metadata.data.name}
              />
            )}
          </div>
        ))}
      </div>
      <div>
        {rentalCardConfig.invalidators.length > 1 && (
          <div className="flex items-center justify-between border-t-[2px] border-border py-4">
            <div
              className={`flex flex-col transition-opacity ${
                selectedInvalidators.length > 0 ? 'opacity-50' : ''
              }`}
            >
              <div className="text-lg text-medium-3">Step 1</div>
              <div className="text-2xl leading-6 text-light-0">Rent for</div>
            </div>
            <div className="flex gap-1">
              {selectedInvalidators.length === 0 ? (
                rentalCardConfig.invalidators.map((invalidator) => (
                  <div
                    key={invalidator}
                    className="cursor-pointer rounded-lg border-[1px] border-border bg-dark-4 px-2 py-2 text-lg transition-colors"
                    css={css`
                      &:hover {
                        background-color: ${lighten(0.1, '#000')};
                      }
                    `}
                    onClick={() => setSelectedInvalidators([invalidator])}
                  >
                    {capitalizeFirstLetter(invalidator)}
                  </div>
                ))
              ) : (
                <div
                  className="flex cursor-pointer items-center gap-3 rounded-lg border-[1px] border-border bg-dark-5 px-2 py-2 text-lg transition-colors"
                  css={css`
                    &:hover {
                      background-color: ${lighten(0.1, '#000')};
                    }
                  `}
                  onClick={() => setSelectedInvalidators([])}
                >
                  {capitalizeFirstLetter(selectedInvalidators[0] || '')}
                  <GlyphEdit />
                </div>
              )}
            </div>
          </div>
        )}
        <div
          className={`mb-2 flex items-center justify-between border-t-[2px] border-border py-4 ${
            selectedInvalidators.length === 0 ? 'border-b-[2px]' : ''
          }`}
        >
          <div
            className={`flex flex-col transition-opacity ${
              selectedInvalidators.length === 0 ? 'opacity-50' : ''
            }`}
          >
            <div className="text-lg text-medium-3">Step 2</div>
            <div className="text-2xl leading-6 text-light-0">
              Rental settings
            </div>
          </div>
          <div className="flex gap-1">
            {selectedInvalidators.length > 0 &&
              (visibilities.length > 1 || showClaimRentalReceipt) && (
                <Tooltip title="Set up your reccuring listing or listing visibility">
                  <div
                    className="cursor-pointer text-lg text-primary"
                    onClick={() =>
                      setShowAdditionalOptions(!showAdditionalOptions)
                    }
                  >
                    {showAdditionalOptions ? '[-]' : '[+]'} Advanced settings
                  </div>
                </Tooltip>
              )}
          </div>
        </div>
        {selectedInvalidators.length > 0 && (
          <div className="flex flex-col gap-4">
            <div
              className={`flex overflow-hidden rounded-md border-[1px] border-primary-hover bg-primary-light transition-all ${
                showAdditionalOptions ? 'h-auto opacity-100' : 'h-0 opacity-0'
              }`}
            >
              {invalidationTypes.length > 1 && (
                <div
                  className="flex w-1/2 flex-col gap-3 border-r-[2px] p-5"
                  css={css`
                    border-color: rgba(200, 138, 244, 0.12);
                  `}
                >
                  <div className="text-lg text-light-0">Recurring Listing:</div>
                  <div>
                    {invalidationTypes.length === 2 &&
                    invalidationTypes
                      .map((v) => v.type)
                      .includes(InvalidationType.Reissue) &&
                    invalidationTypes
                      .map((v) => v.type)
                      .includes(InvalidationType.Return) ? (
                      <Toggle
                        defaultValue={
                          invalidationType === InvalidationType.Reissue
                        }
                        onChange={(v) =>
                          setInvalidationType(
                            v
                              ? InvalidationType.Reissue
                              : InvalidationType.Return
                          )
                        }
                      />
                    ) : (
                      <Switch<InvalidationType>
                        defaultOption={{
                          value: invalidationType,
                          label: INVALIDATION_TYPES.find(
                            (v) => v.type === invalidationType
                          )?.label,
                        }}
                        onChange={(v) => setInvalidationType(v.value)}
                        options={invalidationTypes.map(({ label, type }) => ({
                          label: capitalizeFirstLetter(label),
                          value: type,
                        }))}
                      />
                    )}
                  </div>
                  <div>
                    {
                      {
                        [InvalidationType.Reissue]:
                          'After the rental expiration this NFT will be automatically relisted on the Marketplace.',
                        [InvalidationType.Return]:
                          'Upon the rental expiration this NFT will be securely returned into your wallet.',
                        [InvalidationType.Release]:
                          'Upon the rental expiration this NFT will be released to the current renter to own.',
                        [InvalidationType.Invalidate]:
                          'Upon the rental expiration this NFT will be marked as invalid forever.',
                      }[invalidationType]
                    }
                  </div>
                </div>
              )}
              {visibilities.length > 1 && (
                <div className="flex w-1/2 flex-col gap-3 p-5">
                  <div className="text-lg text-light-0">Visibility:</div>
                  <div>
                    <Switch<VisibilityOption>
                      defaultOption={{
                        value: visibility,
                        label: capitalizeFirstLetter(visibility),
                      }}
                      onChange={(v) => setVisibiliy(v.value)}
                      options={visibilities.map((value) => ({
                        label: capitalizeFirstLetter(value),
                        value: value,
                      }))}
                    />
                  </div>
                  <div>
                    {visibility === 'private'
                      ? 'Your will receive a private one-time rental claim link to share.'
                      : 'Your NFT listing will be available to everyone.'}
                  </div>
                </div>
              )}
              {showClaimRentalReceipt && (
                <div
                  className="flex w-1/2 flex-col gap-3 border-r-[2px] p-5"
                  css={css`
                    border-color: rgba(200, 138, 244, 0.12);
                  `}
                >
                  <div className="text-lg text-light-0">Rent receipt:</div>
                  <div>
                    <Toggle
                      defaultValue={claimRentalReceipt}
                      onChange={(v) => setClaimRentalReceipt(v)}
                    />
                  </div>
                  <div>
                    If selected, a receipt mint will be generated for the
                    rental. The owner of the receipt mint will act as the
                    issuer.
                  </div>
                </div>
              )}
            </div>
            {selectedInvalidators.includes('rate') && (
              <div className="flex gap-6">
                <div className="w-3/4">
                  <div className="mb-1 text-light-0">Rental rate</div>
                  <div className="flex gap-1">
                    <MintPriceSelector
                      price={extensionPaymentAmount}
                      mint={extensionPaymentMint}
                      paymentMintData={paymentMintData}
                      mintDisabled={paymentMintData.length === 1}
                      handlePrice={setExtensionPaymentAmount}
                      handleMint={setExtensionPaymentMint}
                    />
                    <div>
                      <Selector<DurationOption>
                        className="w-max rounded-[4px]"
                        onChange={(e) => setDurationOption(e.value)}
                        defaultOption={{
                          value: defaultDurationOption,
                          label: capitalizeFirstLetter(
                            defaultDurationOption
                          ).substring(0, defaultDurationOption.length - 1),
                        }}
                        disabled={
                          rentalCardConfig.invalidationOptions
                            ?.freezeRentalRateDuration
                            ? true
                            : false
                        }
                        options={Object.keys(durationData).map((option) => ({
                          label: capitalizeFirstLetter(option).substring(
                            0,
                            option.length - 1
                          ),
                          value: option as DurationOption,
                        }))}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-light-0">Max rental duration</div>
                  {/* <input
                  css={css`
                    color-scheme: dark;
                  `}
                  type="datetime-local"
                  className="rounded-md border border-border bg-dark-4 py-2 px-3 text-light-0 placeholder-gray-500 focus:bg-gray-800 focus:outline-none"
                  defaultValue={
                    extensionMaxExpiration
                      ? moment(extensionMaxExpiration * 1000)
                      : undefined
                  }
                  onChange={(e) =>
                    setExtensionMaxExpiration(e ? e.valueOf() / 1000 : null)
                  }
                /> */}
                  <DatePicker
                    className="rounded-[4px] bg-dark-4"
                    defaultValue={
                      extensionMaxExpiration
                        ? moment(extensionMaxExpiration * 1000)
                        : undefined
                    }
                    showTime
                    onChange={(e) =>
                      setExtensionMaxExpiration(e ? e.valueOf() / 1000 : null)
                    }
                  />
                </div>
              </div>
            )}
            {selectedInvalidators.includes('manual') && (
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
                      className="ml-2 h-[31px]"
                      onClick={() =>
                        setCustomInvalidator(wallet.publicKey.toString())
                      }
                    >
                      Me
                    </Button>
                  </div>
                }
              />
            )}
            {selectedInvalidators.includes('usages') && (
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
            )}
            {selectedInvalidators.includes('expiration') && (
              <div className="flex gap-6">
                <div className="w-3/4">
                  <div className="mb-1 text-light-0">Rental price</div>
                  <MintPriceSelector
                    price={price}
                    mint={paymentMint}
                    mintDisabled={paymentMintData.length === 1}
                    paymentMintData={paymentMintData}
                    handlePrice={setPrice}
                    handleMint={setPaymentMint}
                  />
                </div>
                <div>
                  <div className="mb-1 text-light-0">Expiration</div>
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
              </div>
            )}
            {selectedInvalidators.includes('duration') && (
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
                        value={
                          rentalCardConfig.invalidationOptions
                            ?.freezeRentalDuration
                            ? rentalCardConfig.invalidationOptions
                                ?.freezeRentalDuration.value
                            : durationAmount?.toString() || '0'
                        }
                        onChange={(e) => setDurationAmount(parseInt(e))}
                        disabled={
                          rentalCardConfig.invalidationOptions
                            ?.freezeRentalDuration
                            ? true
                            : false
                        }
                      />
                      <Select
                        className="w-max rounded-[4px]"
                        onChange={(e) => setDurationOption(e)}
                        value={durationOption}
                        defaultValue={defaultDurationOption}
                        disabled={
                          rentalCardConfig.invalidationOptions
                            ?.freezeRentalDuration
                            ? true
                            : false
                        }
                      >
                        {Object.keys(durationData).map((option) => (
                          <Option key={option} value={option}>
                            {durationAmount && durationAmount === 1
                              ? capitalizeFirstLetter(option).substring(
                                  0,
                                  option.length - 1
                                )
                              : capitalizeFirstLetter(option)}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </div>
                }
              />
            )}
            {selectedInvalidators.includes('duration') &&
              rentalCardConfig.extensionOptions && (
                <>
                  <button
                    className="mb-2 block text-blue-500"
                    onClick={() => setShowExtendDuration(!showExtendDuration)}
                  >
                    {showExtendDuration ? '[-]' : '[+]'} Extendability
                  </button>
                  {showExtendDuration && (
                    <div className="grid grid-cols-2 gap-4 py-2">
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
                              paymentMintData={paymentMintData}
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
                                onChange={(e) => setExtensionDurationOption(e)}
                                defaultValue={defaultDurationOption}
                              >
                                {Object.keys(durationData).map((option) => (
                                  <Option key={option} value={option}>
                                    {durationAmount && durationAmount === 1
                                      ? capitalizeFirstLetter(option).substring(
                                          0,
                                          option.length - 1
                                        )
                                      : capitalizeFirstLetter(option)}
                                  </Option>
                                ))}
                              </Select>
                            </div>
                          </div>
                        }
                      />
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
                      {rentalCardConfig.extensionOptions
                        ?.showDisablePartialExtension && (
                        <div className="mt-1">
                          <span
                            className="cursor-pointer"
                            onClick={() =>
                              setDisablePartialExtension(
                                !disablePartialExtension
                              )
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
                            If selected, rental extensions must occur in
                            multiples of the extension duration.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            {link ? (
              <div>
                <Alert
                  style={{
                    height: 'auto',
                    cursor: 'pointer',
                  }}
                  message={
                    <>
                      {selectedTokenDatas.length === 1 && totalListed === 1 ? (
                        <div>
                          Successfully listed: ({totalListed} /{' '}
                          {selectedTokenDatas.length})
                          <br />
                          Link created {link.substring(0, 20)}
                          ...
                          {visibility === 'private' && (
                            <>
                              {link.substring(link.length - 5)}
                              <div>
                                This link can only be used once and cannot be
                                regenerated
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div>
                          {' '}
                          Successfully listed: ({totalListed} / {totalTokens}){' '}
                        </div>
                      )}
                    </>
                  }
                  type="success"
                  showIcon
                />
              </div>
            ) : error ? (
              <div>
                <Alert
                  style={{ height: 'auto' }}
                  message={
                    <div
                      className="flex w-full cursor-pointer flex-row justify-between"
                      onClick={() => setError(undefined)}
                    >
                      <div style={{ wordBreak: 'break-word' }}>{error}</div>
                      <div className="float-right mt-[3px]">
                        <IoMdClose />
                      </div>
                    </div>
                  }
                  type="error"
                  showIcon
                />
              </div>
            ) : (
              <div className="rounded-md bg-dark-4">
                <div className="p-4 text-center">
                  Whoever claims this rental may own the asset{' '}
                  {totalUsages && extensionMaxExpiration ? (
                    `for either ${totalUsages} uses or until ${longDateString(
                      extensionMaxExpiration
                    )} and then it will be ${
                      invalidationType === InvalidationType.Return
                        ? 'securely returned to you.'
                        : invalidationType === InvalidationType.Release
                        ? 'released to whoever claims it.'
                        : invalidationType === InvalidationType.Reissue
                        ? 'relisted back in the marketplace.'
                        : 'invalid forever.'
                    }`
                  ) : totalUsages ? (
                    `for ${totalUsages} uses and then it will be ${
                      invalidationType === InvalidationType.Return
                        ? 'securely returned to you.'
                        : invalidationType === InvalidationType.Release
                        ? 'released to whoever claims it.'
                        : invalidationType === InvalidationType.Reissue
                        ? 'relisted back in the marketplace.'
                        : 'invalid forever.'
                    }`
                  ) : durationAmount && durationOption ? (
                    `
                            for ${durationAmount} ${
                      durationAmount !== 1
                        ? durationOption.toLocaleLowerCase()
                        : durationOption
                            .toLocaleLowerCase()
                            .substring(0, durationOption.length - 1)
                    } and then it will be ${
                      invalidationType === InvalidationType.Return
                        ? 'securely returned to you.'
                        : invalidationType === InvalidationType.Release
                        ? 'released to whoever claims it.'
                        : invalidationType === InvalidationType.Reissue
                        ? 'relisted back in the marketplace.'
                        : 'invalid forever.'
                    }`
                  ) : customInvalidator ? (
                    <>
                      until{' '}
                      {
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={pubKeyUrl(
                            new PublicKey(customInvalidator),
                            cluster || 'mainnet'
                          )}
                        >
                          {shortPubKey(customInvalidator)}
                        </a>
                      }{' '}
                      revokes it
                    </>
                  ) : selectedInvalidators.includes('rate') ? (
                    `at the rate of  ${extensionRate()}.`
                  ) : !extensionMaxExpiration ? (
                    'forever.'
                  ) : (
                    '.'
                  )}
                  {extensionMaxExpiration
                    ? ` This rental will be returned to your wallet at ${new Date(
                        extensionMaxExpiration * 1000
                      ).toLocaleString('en-US')}.`
                    : ''}
                  {showExtendDuration &&
                  extensionPaymentAmount &&
                  extensionDurationAmount &&
                  extensionPaymentMint &&
                  paymentMintInfos.data &&
                  durationAmount !== 0
                    ? ` The claimer can choose to extend the rental at the rate of ${fmtMintAmount(
                        paymentMintInfos.data[extensionPaymentMint.toString()],
                        new anchor.BN(extensionPaymentAmount)
                      )} ${
                        paymentMintData.find(
                          (obj) => obj.mint === extensionPaymentMint
                        )?.symbol
                      } / ${extensionDurationAmount} ${
                        extensionDurationAmount === 1
                          ? extensionDurationOption
                              ?.toLowerCase()
                              .substring(0, extensionDurationOption.length - 1)
                          : extensionDurationOption?.toLowerCase()
                      }${
                        extensionMaxExpiration
                          ? ` up until ${new Date(
                              extensionMaxExpiration * 1000
                            ).toLocaleString('en-US')}.`
                          : '.'
                      } `
                    : null}
                  <div className="mt-2 flex gap-3">
                    {selectedInvalidators.includes('rate') ? (
                      <p>
                        <b>Rate: </b> {extensionRate()}
                      </p>
                    ) : (
                      <p>
                        <b>Price: </b>{' '}
                        {paymentMintInfos.data
                          ? fmtMintAmount(
                              paymentMintInfos.data[paymentMint.toString()],
                              new anchor.BN(price)
                            )
                          : 0}{' '}
                        {
                          paymentMintData.find(
                            (obj) => obj.mint === paymentMint
                          )?.symbol
                        }
                      </p>
                    )}

                    {durationAmount && durationOption ? (
                      <p>
                        <b>Duration: </b> {durationAmount}{' '}
                        {durationAmount !== 1
                          ? durationOption.toLocaleLowerCase()
                          : durationOption
                              .toLocaleLowerCase()
                              .substring(0, durationOption.length - 1)}
                      </p>
                    ) : null}
                    {extensionMaxExpiration && (
                      <p>
                        <b>Expiration: </b>{' '}
                        {shortDateString(extensionMaxExpiration)}
                      </p>
                    )}
                    {totalUsages && (
                      <p>
                        <b>Usages: </b> {totalUsages}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div
              className="flex cursor-pointer gap-2"
              onClick={() => setConfirmRentalTerms(!confirmRentalTerms)}
            >
              <div
                className={`h-5 w-5 shrink-0 rounded-md border-[.5px] border-light-1 transition-all ${
                  confirmRentalTerms ? 'bg-primary' : ''
                }`}
              />
              <div>
                I have read, understood and agree to Risk Disclaimer, as well as
                I agree to the rental terms displayed here.
              </div>
            </div>
            <Button
              variant="primary"
              disabled={
                !confirmRentalTerms ||
                (link === 'success' &&
                  (totalListed === selectedTokenDatas.length ||
                    selectedTokenDatas.length === 0))
              }
              onClick={link ? () => handleCopy(link) : handleRental}
            >
              {link && link !== 'success' ? (
                <div className="flex items-center justify-center gap-[5px] text-lg">
                  <FaLink />
                  {link.substring(0, 40)}
                  ...
                  {link.substring(link.length - 10)}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-[5px] text-lg">
                  {visibility === 'private'
                    ? 'Get private link'
                    : 'List for rent'}
                  <FiSend />
                </div>
              )}
            </Button>
          </div>
        )}
        <PoweredByFooter />
      </div>
    </div>
  )
}
