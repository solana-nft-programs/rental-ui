import {
  capitalizeFirstLetter,
  getQueryParam,
  longDateString,
  pubKeyUrl,
  secondstoDuration,
  shortDateString,
  shortPubKey,
  tryPublicKey,
} from '@cardinal/common'
import { claimLinks } from '@cardinal/token-manager'
import { InvalidationType } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { css } from '@emotion/react'
import * as anchor from '@project-serum/anchor'
import { DatePicker } from 'antd'
import type { TokenData } from 'api/api'
import { GlyphEdit } from 'assets/GlyphEdit'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { DurationInput } from 'common/DurationInput'
import { notify } from 'common/Notification'
import { Selector } from 'common/Selector'
import { Switch } from 'common/Switch'
import { Toggle } from 'common/Toggle'
import { Tooltip } from 'common/Tooltip'
import { fmtMintAmount } from 'common/units'
import { useHandleIssueRental } from 'handlers/useHandleIssueRental'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useWalletId } from 'hooks/useWalletId'
import moment from 'moment'
import { lighten } from 'polished'
import { useModal } from 'providers/ModalProvider'
import { getLink } from 'providers/ProjectConfigProvider'
import { useEffect, useState } from 'react'
import { FaLink } from 'react-icons/fa'
import { FiSend } from 'react-icons/fi'
import { PAYMENT_MINTS } from 'rental-components/common/Constants'
import { MintPriceSelector } from 'rental-components/common/MintPriceSelector'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'

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

export type RentalIssueCardProps = {
  cluster?: string
  tokenDatas: TokenData[]
  rentalCardConfig: RentalCardConfig
}

export const RentalIssueCard = ({
  cluster,
  tokenDatas,
  rentalCardConfig,
}: RentalIssueCardProps) => {
  const [error, setError] = useState<string>()
  const [link, setLink] = useState<string | null>()
  const paymentMintInfos = usePaymentMints()
  const [totalTokens, setTotalTokens] = useState(tokenDatas.length)
  const handleIssueRental = useHandleIssueRental()
  const walletId = useWalletId()

  // Pull overrides from config
  const visibilities =
    rentalCardConfig.invalidationOptions?.visibilities || VISIBILITY_OPTIONS
  const invalidationTypes =
    rentalCardConfig.invalidationOptions?.customInvalidationTypes &&
    walletId &&
    walletId.toString() in
      rentalCardConfig.invalidationOptions.customInvalidationTypes
      ? INVALIDATION_TYPES.filter(({ label }) =>
          rentalCardConfig.invalidationOptions?.customInvalidationTypes?.[
            walletId.toString()
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

  const showClaimRentalReceipt =
    rentalCardConfig.invalidationOptions?.showClaimRentalReceipt

  // defaults
  const defaultVisibility = visibilities[0]
  const defaultDurationOption =
    rentalCardConfig.invalidationOptions?.freezeRentalDuration
      ?.durationOption || 'days'
  const defaultPaymentMint = paymentMintData[0]!
  const defaultInvalidationType = invalidationTypes[0]!.type

  // state
  const [price, setPrice] = useState<anchor.BN>()
  const [paymentMint, setPaymentMint] = useState<string>(
    defaultPaymentMint.mint
  )
  const [durationSeconds, setDurationSeconds] = useState<number>()
  const [extensionPaymentAmount, setExtensionPaymentAmount] =
    useState<anchor.BN>()
  const [extensionPaymentMint, setExtensionPaymentMint] = useState(
    defaultPaymentMint.mint
  )
  const [extensionDurationSeconds, setExtensionDurationSeconds] =
    useState<number>()

  const [maxExpiration, setMaxExpiration] = useState<number | undefined>(
    rentalCardConfig.invalidationOptions?.maxDurationAllowed?.value
      ? Date.now() / 1000 +
          rentalCardConfig.invalidationOptions?.maxDurationAllowed?.value
      : undefined
  )
  const [disablePartialExtension, setDisablePartialExtension] =
    useState<boolean>()
  const [totalUsages, setTotalUsages] = useState<number>()
  const [visibility, setVisibiliy] =
    useState<VisibilityOption>(defaultVisibility)
  const [invalidationType, setInvalidationType] = useState(
    defaultInvalidationType
  )
  const [customInvalidator, setCustomInvalidator] = useState<string>()
  const [claimRentalReceipt, setClaimRentalReceipt] = useState(
    rentalCardConfig.invalidationOptions?.setClaimRentalReceipt || false
  )

  const [selectedInvalidators, setSelectedInvalidators] = useState<
    InvalidatorOption[]
  >([])
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false)
  const [showExtendDuration, setShowExtendDuration] = useState(false)
  const [confirmRentalTerms, setConfirmRentalTerms] = useState(false)
  const [totalListed, setTotalListed] = useState(0)

  // reset
  useEffect(() => {
    setShowAdditionalOptions(false)
    if (!selectedInvalidators.includes('duration')) {
      setExtensionDurationSeconds(undefined)
      setDurationSeconds(undefined)
    }
    if (!selectedInvalidators.includes('expiration')) {
      setMaxExpiration(undefined)
    }
    if (!selectedInvalidators.includes('manual')) {
      setCustomInvalidator(undefined)
    }
    if (!selectedInvalidators.includes('usages')) {
      setTotalUsages(undefined)
    }
    if (!selectedInvalidators.includes('rate')) {
      setMaxExpiration(undefined)
      setExtensionDurationSeconds(undefined)
    }
    if (selectedInvalidators.includes('rate')) {
      if (
        rentalCardConfig.invalidationOptions?.freezeRentalRateDuration &&
        rentalCardConfig.invalidationOptions?.freezeRentalRateDuration
          .durationOption &&
        rentalCardConfig.invalidationOptions?.freezeRentalRateDuration.value
      ) {
        setExtensionDurationSeconds(
          DURATION_DATA[
            rentalCardConfig.invalidationOptions?.freezeRentalRateDuration
              .durationOption
          ] *
            parseInt(
              rentalCardConfig.invalidationOptions?.freezeRentalRateDuration
                .value
            )
        )
      }
      setExtensionPaymentMint(defaultPaymentMint.mint)
      setExtensionPaymentAmount(undefined)
      setMaxExpiration(
        rentalCardConfig.invalidationOptions?.maxDurationAllowed?.value
          ? Date.now() / 1000 +
              rentalCardConfig.invalidationOptions?.maxDurationAllowed?.value
          : undefined
      )
    }
  }, [selectedInvalidators])

  const extensionRate = () => {
    const denominator = extensionDurationSeconds
      ? SECONDS_TO_DURATION[extensionDurationSeconds]
          ?.toLowerCase()
          .slice(0, -1) ?? secondstoDuration(extensionDurationSeconds)
      : '?'

    return `${
      paymentMintInfos.data && extensionPaymentAmount
        ? fmtMintAmount(
            paymentMintInfos.data[extensionPaymentMint.toString()],
            extensionPaymentAmount
          )
        : 0
    } ${
      paymentMintData.find((obj) => obj.mint === extensionPaymentMint)?.symbol
    } / ${denominator}`
  }

  return (
    <div className="rounded-xl bg-dark-6 p-6">
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
              <div className="text-base text-medium-3">Step 1</div>
              <div className="text-2xl text-light-0">Rent for</div>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedInvalidators.length === 0 ? (
                rentalCardConfig.invalidators.map((invalidator) => (
                  <div
                    key={invalidator}
                    className="cursor-pointer rounded-xl border-[2px] border-border bg-dark-4 px-3 py-2 text-base transition-colors"
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
                  className="flex cursor-pointer items-center gap-3 rounded-xl border-[2px] border-border bg-dark-5 px-2 py-2 text-base transition-colors"
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
          className={`flex items-center justify-between border-t-[2px] border-border py-4 ${
            selectedInvalidators.length === 0 ? 'border-b-[2px]' : ''
          }`}
        >
          <div
            className={`flex flex-col transition-opacity ${
              selectedInvalidators.length === 0 ? 'opacity-50' : ''
            }`}
          >
            <div className="text-base text-medium-3">Step 2</div>
            <div className="text-2xl text-light-0">Rental settings</div>
          </div>
          <div className="flex gap-1">
            {selectedInvalidators.length > 0 &&
              (visibilities.length > 1 || showClaimRentalReceipt) && (
                <Tooltip title="Set up your reccuring listing or listing visibility">
                  <div
                    className="cursor-pointer text-base text-primary"
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
              className={`flex overflow-hidden rounded-xl border-[1px] border-primary-hover bg-primary-light transition-all ${
                showAdditionalOptions
                  ? 'mb-0 h-auto opacity-100'
                  : '-mb-4 h-0 opacity-0'
              }`}
            >
              {invalidationTypes.length > 1 && (
                <div
                  className="flex w-1/2 flex-col gap-3 border-r-[2px] p-5"
                  css={css`
                    border-color: rgba(200, 138, 244, 0.12);
                  `}
                >
                  <div className="text-base text-light-0">
                    Recurring Listing:
                  </div>
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
                  <div className="text-base text-light-0">Visibility:</div>
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
                  <div className="text-base text-light-0">Rent receipt:</div>
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
              <div className="flex gap-4">
                <div className="w-3/4">
                  <div className="mb-1 text-base text-light-0">Rental rate</div>
                  <div className="flex gap-1">
                    <MintPriceSelector
                      defaultPrice={extensionPaymentAmount}
                      defaultMint={extensionPaymentMint}
                      paymentMintData={paymentMintData}
                      mintDisabled={paymentMintData.length === 1}
                      handleValue={(v) => {
                        setExtensionPaymentAmount(v.price.value)
                        setExtensionPaymentMint(v.mint.value)
                      }}
                    />
                    <div>
                      <Selector<DurationOption>
                        className="w-max rounded-xl"
                        onChange={(e) =>
                          setExtensionDurationSeconds(DURATION_DATA[e.value])
                        }
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
                  <div className="mb-1 text-base text-light-0">
                    Max rental duration
                  </div>
                  {/* <input
                  css={css`
                    color-scheme: dark;
                  `}
                  type="datetime-local"
                  className="rounded-md border border-border bg-dark-4 py-2 px-3 text-light-0 placeholder-gray-500 focus:bg-gray-800 focus:outline-none"
                  defaultValue={
                    maxExpiration
                      ? moment(maxExpiration * 1000)
                      : undefined
                  }
                  onChange={(e) =>
                    setMaxExpiration(e ? e.valueOf() / 1000 : null)
                  }
                /> */}
                  <DatePicker
                    className="rounded-xl bg-dark-4 py-2 px-3 text-base"
                    css={css`
                      input {
                        line-height: 1.5rem !important;
                      }
                    `}
                    value={
                      maxExpiration ? moment(maxExpiration * 1000) : undefined
                    }
                    showTime
                    onChange={(e) =>
                      setMaxExpiration(e ? e.valueOf() / 1000 : undefined)
                    }
                  />
                </div>
              </div>
            )}
            {selectedInvalidators.includes('manual') && (
              <div>
                <div className="mb-1 text-base text-light-0">
                  Manual revocation pubkey
                </div>
                <div className="relative flex">
                  <input
                    className="w-full rounded-xl border border-border bg-dark-4 py-2 px-3 text-light-0 placeholder-medium-3 transition-all focus:border-primary focus:outline-none"
                    value={customInvalidator}
                    placeholder={shortPubKey(walletId)}
                    onChange={(e) => setCustomInvalidator(e.target.value)}
                  />
                  <Button
                    variant={'primary'}
                    className="absolute right-0 top-[1px] w-16 rounded-xl"
                    css={css`
                      height: calc(100% - 2px);
                    `}
                    onClick={() => setCustomInvalidator(walletId?.toString())}
                  >
                    Me
                  </Button>
                </div>
              </div>
            )}
            {selectedInvalidators.includes('usages') && (
              <div>
                <div className="mb-1 text-base text-light-0">Usages</div>
                <input
                  className="w-full rounded-xl border border-border bg-dark-4 py-2 px-3 text-light-0 placeholder-medium-3 transition-all focus:border-primary focus:outline-none"
                  value={customInvalidator}
                  type="number"
                  placeholder={'Number of usages'}
                  onChange={(e) => setTotalUsages(parseInt(e.target.value))}
                />
              </div>
            )}
            {selectedInvalidators.includes('expiration') && (
              <div className="flex gap-4">
                <div className="w-3/4">
                  <div className="mb-1 text-base text-light-0">
                    Rental price
                  </div>
                  <MintPriceSelector
                    defaultPrice={price}
                    defaultMint={paymentMint}
                    mintDisabled={paymentMintData.length === 1}
                    paymentMintData={paymentMintData}
                    handleValue={(v) => {
                      setPrice(v.price.value)
                      setPaymentMint(v.mint.value)
                    }}
                  />
                </div>
                <div>
                  <div className="mb-1 text-base text-light-0">Expiration</div>
                  <DatePicker
                    className="rounded-xl bg-dark-4 py-2 px-3 text-base"
                    css={css`
                      input {
                        line-height: 1.5rem !important;
                      }
                    `}
                    showTime
                    onChange={(e) =>
                      setMaxExpiration(e ? e.valueOf() / 1000 : undefined)
                    }
                  />
                </div>
              </div>
            )}
            {selectedInvalidators.includes('duration') && (
              <>
                <div className="flex gap-4">
                  <div className="w-3/4">
                    <div className="mb-1 text-base text-light-0">
                      Rental price
                    </div>
                    <MintPriceSelector
                      defaultPrice={price}
                      defaultMint={paymentMint}
                      mintDisabled={paymentMintData.length === 1}
                      paymentMintData={paymentMintData}
                      handleValue={(v) => {
                        setPrice(v.price.value)
                        setPaymentMint(v.mint.value)
                      }}
                    />
                  </div>
                  <div className="">
                    <div className="mb-1 text-base text-light-0">Duration</div>
                    <DurationInput
                      handleChange={(v) => setDurationSeconds(v)}
                      defaultAmount={
                        rentalCardConfig.invalidationOptions
                          ?.freezeRentalDuration?.value
                          ? parseInt(
                              rentalCardConfig.invalidationOptions
                                ?.freezeRentalDuration?.value
                            )
                          : undefined
                      }
                      defaultOption={
                        rentalCardConfig.invalidationOptions
                          ?.freezeRentalDuration?.durationOption
                      }
                      disabled={
                        !!rentalCardConfig.invalidationOptions
                          ?.freezeRentalDuration
                      }
                    />
                  </div>
                </div>
                {rentalCardConfig.extensionOptions && (
                  <>
                    <button
                      className="mb-2 block text-blue-500"
                      onClick={() => setShowExtendDuration(!showExtendDuration)}
                    >
                      {showExtendDuration ? '[-]' : '[+]'} Extendability
                    </button>
                    {showExtendDuration && (
                      <div className="flex gap-4">
                        <div className="w-3/4">
                          <div className="mb-1 text-base text-light-0">
                            Extension price
                          </div>
                          <MintPriceSelector
                            disabled={visibility === 'private'}
                            defaultPrice={extensionPaymentAmount}
                            defaultMint={extensionPaymentMint}
                            mintDisabled={paymentMintData.length === 1}
                            paymentMintData={paymentMintData}
                            handleValue={(v) => {
                              setExtensionPaymentAmount(v.price.value)
                              setExtensionPaymentMint(v.mint.value)
                            }}
                          />
                        </div>
                        <div>
                          <div className="mb-1 text-base text-light-0">
                            Extension duration
                          </div>
                          <DurationInput
                            handleChange={(v) => setExtensionDurationSeconds(v)}
                            defaultAmount={1}
                            defaultOption={defaultDurationOption}
                          />
                        </div>
                        <div>
                          <div className="mb-1 text-base text-light-0">
                            Max rental duration
                          </div>
                          <DatePicker
                            className="rounded-xl bg-dark-4 py-2 px-3 text-base"
                            css={css`
                              input {
                                line-height: 1.5rem !important;
                              }
                            `}
                            value={
                              maxExpiration
                                ? moment(maxExpiration * 1000)
                                : undefined
                            }
                            showTime
                            onChange={(e) =>
                              setMaxExpiration(
                                e ? e.valueOf() / 1000 : undefined
                              )
                            }
                          />
                        </div>
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
              </>
            )}
            {link ? (
              <Alert variant="success" className="text-left">
                {tokenDatas.length === 1 && totalListed === 1 ? (
                  <div>
                    Successfully listed: ({totalListed} / {tokenDatas.length})
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
              </Alert>
            ) : error ? (
              <Alert
                variant="error"
                showClose
                onClick={() => setError(undefined)}
              >
                {error}
              </Alert>
            ) : (
              <div className="rounded-xl bg-dark-4">
                <div className="flex items-center justify-center p-4">
                  Whoever claims this rental may own the asset{' '}
                  {totalUsages && maxExpiration ? (
                    `for either ${totalUsages} uses or until ${longDateString(
                      maxExpiration
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
                  ) : durationSeconds ? (
                    ` for ${secondstoDuration(
                      durationSeconds
                    )} and then it will be ${
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
                          className="mx-[3px]"
                          href={pubKeyUrl(
                            tryPublicKey(customInvalidator),
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
                  ) : !maxExpiration ? (
                    'forever.'
                  ) : (
                    '.'
                  )}
                  {maxExpiration
                    ? ` This rental will be returned to your wallet at ${new Date(
                        maxExpiration * 1000
                      ).toLocaleString('en-US')}.`
                    : ''}
                  {showExtendDuration &&
                    extensionPaymentAmount &&
                    extensionDurationSeconds &&
                    extensionPaymentMint &&
                    paymentMintInfos.data &&
                    ` The claimer can choose to extend the rental at the rate of ${fmtMintAmount(
                      paymentMintInfos.data[extensionPaymentMint.toString()],
                      new anchor.BN(extensionPaymentAmount)
                    )} ${
                      paymentMintData.find(
                        (obj) => obj.mint === extensionPaymentMint
                      )?.symbol
                    } / ${secondstoDuration(extensionDurationSeconds)}${
                      maxExpiration
                        ? ` up until ${new Date(
                            maxExpiration * 1000
                          ).toLocaleString('en-US')}.`
                        : '.'
                    } `}
                </div>
                <div className="flex gap-3 border-t-[1px] border-border p-4">
                  {selectedInvalidators.includes('rate') ? (
                    <p>
                      <b>Rate: </b> {extensionRate()}
                    </p>
                  ) : (
                    price &&
                    price.gt(new anchor.BN(0)) && (
                      <p>
                        <b>Price: </b>{' '}
                        {paymentMintInfos.data
                          ? fmtMintAmount(
                              paymentMintInfos.data[paymentMint.toString()],
                              price
                            )
                          : 0}{' '}
                        {
                          paymentMintData.find(
                            (obj) => obj.mint === paymentMint
                          )?.symbol
                        }
                      </p>
                    )
                  )}
                  {durationSeconds ? (
                    <p>
                      <b>Duration: </b> {secondstoDuration(durationSeconds)}
                    </p>
                  ) : null}
                  {maxExpiration && (
                    <p>
                      <b>Expiration: </b> {shortDateString(maxExpiration)}
                    </p>
                  )}
                  {totalUsages && (
                    <p>
                      <b>Usages: </b> {totalUsages}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div
              className="flex cursor-pointer gap-3 text-sm"
              onClick={() => {
                setConfirmRentalTerms(!confirmRentalTerms)
                setError(undefined)
              }}
            >
              <div
                className={`h-5 w-5 shrink-0 rounded-md border-[2px] border-border transition-all ${
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
              className="h-12"
              disabled={
                !confirmRentalTerms ||
                (link === 'success' &&
                  (totalListed === tokenDatas.length ||
                    tokenDatas.length === 0))
              }
              loading={handleIssueRental.isLoading}
              onClick={async () => {
                link
                  ? handleCopy(link)
                  : handleIssueRental.mutate(
                      {
                        tokenDatas: tokenDatas,
                        rentalCardConfig,
                        price,
                        paymentMint,
                        durationSeconds,
                        maxExpiration: maxExpiration,
                        extensionPaymentMint,
                        extensionPaymentAmount,
                        extensionDurationSeconds,
                        totalUsages,
                        invalidationType,
                        visibility,
                        customInvalidator,
                        disablePartialExtension,
                        claimRentalReceipt,
                      },
                      {
                        onSuccess: ({
                          otpKeypairs,
                          tokenManagerIds,
                          totalSuccessfulTransactions,
                        }) => {
                          setTotalListed(totalSuccessfulTransactions)
                          setTotalTokens(tokenDatas.length)
                          if (tokenDatas.length === 1 && tokenManagerIds[0]) {
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
                        },
                        onError: (e) => {
                          setError(`${e}`)
                        },
                      }
                    )
              }}
            >
              {link && link !== 'success' ? (
                <div className="flex items-center justify-center gap-[5px] text-base">
                  <FaLink />
                  Copy link
                  {/* {link.substring(0, link.length - 40)}
                  ...
                  {link.substring(link.length - 6)} */}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-[5px] text-base">
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

export const useRentalIssueCard = () => {
  const { showModal } = useModal()
  return {
    showModal: (props: RentalIssueCardProps) =>
      showModal(<RentalIssueCard {...props} />),
  }
}
