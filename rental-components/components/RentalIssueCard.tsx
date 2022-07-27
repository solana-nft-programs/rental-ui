import { capitalizeFirstLetter, getQueryParam } from '@cardinal/common'
import { css } from '@emotion/react'
import type { Keypair } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { GlyphEdit } from 'assets/GlyphEdit'
import { Tooltip } from 'common/Tooltip'
import { lighten } from 'polished'
import { useModal } from 'providers/ModalProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'
import { PoweredByFooter } from 'rental-components/common/PoweredByFooter'
import type {
  InvalidationTypeOption,
  VisibilityOption,
} from 'rental-components/common/RentalIssueAdvanced'
import { VISIBILITY_OPTIONS } from 'rental-components/common/RentalIssueAdvanced'
import { RentalIssueDuration } from 'rental-components/common/RentalIssueDuration'
import { RentalIssueExpiration } from 'rental-components/common/RentalIssueExpiration'
import { RentalIssueManual } from 'rental-components/common/RentalIssueManual'
import { RentalIssueRate } from 'rental-components/common/RentalIssueRate'

import { RentalIssueSuccessCard } from './RentalIssueSuccessCard'

export type TxResult = {
  tokenData: TokenData
  txid?: string
  otpKeypair?: Keypair
  claimLink: string
}

export type InvalidatorOption =
  // | 'usages'
  'expiration' | 'duration' | 'manual' | 'rate'

export type DurationOption =
  | 'minutes'
  | 'hours'
  | 'days'
  | 'weeks'
  | 'months'
  | 'years'

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
  tokenDatas: TokenData[]
}

export const RentalIssueCard = ({ tokenDatas }: RentalIssueCardProps) => {
  const { configFromToken } = useProjectConfig()
  const config = configFromToken(tokenDatas[0])
  const rentalCardConfig = config.rentalCard
  const visibilities =
    rentalCardConfig.invalidationOptions?.visibilities || VISIBILITY_OPTIONS
  const [selectedInvalidators, setSelectedInvalidators] = useState<
    InvalidatorOption[]
  >([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [txResults, setTxResults] = useState<TxResult[]>()
  const invalidatorOptions = rentalCardConfig.invalidators

  if (txResults) {
    return (
      <RentalIssueSuccessCard tokenDatas={tokenDatas} txResults={txResults} />
    )
  }
  return (
    <div className="rounded-xl bg-dark-6 p-6">
      <div className="text-center text-2xl text-light-0">
        Rent out{' '}
        {tokenDatas.length > 1
          ? `(${tokenDatas.length})`
          : tokenDatas[0]
          ? tokenDatas[0].metadata?.data.name
          : ''}
      </div>
      <div className="mb-2 text-center text-lg text-medium-4">
        {config.displayName}
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
        {invalidatorOptions.length > 0 && (
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
                invalidatorOptions.map((invalidator) => (
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
            {selectedInvalidators.length > 0 && visibilities.length > 1 && (
              <Tooltip title="Set up your recurring listing or listing visibility">
                <div
                  className="cursor-pointer text-base text-primary"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? '[-]' : '[+]'} Advanced settings
                </div>
              </Tooltip>
            )}
          </div>
        </div>
        {selectedInvalidators.length > 0 &&
          {
            rate: (
              <RentalIssueRate
                tokenDatas={tokenDatas}
                rentalCardConfig={rentalCardConfig}
                showAdvanced={showAdvanced}
                setTxResults={setTxResults}
              />
            ),
            duration: (
              <RentalIssueDuration
                tokenDatas={tokenDatas}
                rentalCardConfig={rentalCardConfig}
                showAdvanced={showAdvanced}
                setTxResults={setTxResults}
              />
            ),
            expiration: (
              <RentalIssueExpiration
                tokenDatas={tokenDatas}
                rentalCardConfig={rentalCardConfig}
                showAdvanced={showAdvanced}
                setTxResults={setTxResults}
              />
            ),
            usages: <>Not yet supported</>,
            manual: (
              <RentalIssueManual
                tokenDatas={tokenDatas}
                rentalCardConfig={rentalCardConfig}
                showAdvanced={showAdvanced}
                setTxResults={setTxResults}
              />
            ),
          }[selectedInvalidators[0]!]}
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
