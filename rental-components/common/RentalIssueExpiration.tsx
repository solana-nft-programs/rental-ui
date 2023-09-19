import { BN } from '@coral-xyz/anchor'
import { css } from '@emotion/react'
import { tryPublicKey } from '@solana-nft-programs/common'
import { DatePicker } from 'antd'
import { SolanaLogo } from 'assets/SolanaLogo'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { priceAndSymbol } from 'common/NFTClaimButton'
import { handleCopy } from 'common/NFTHeader'
import type { TokenData } from 'data/data'
import type { IssueTxResult } from 'handlers/useHandleIssueRental'
import { useHandleIssueRental } from 'handlers/useHandleIssueRental'
import { PAYMENT_MINTS, usePaymentMints } from 'hooks/usePaymentMints'
import { useState } from 'react'
import { FaLink } from 'react-icons/fa'
import { FiSend } from 'react-icons/fi'
import { MintPriceSelector } from 'rental-components/common/MintPriceSelector'
import type { RentalCardConfig } from 'rental-components/components/RentalIssueCard'

import type { RentalIssueAdvancedValues } from './RentalIssueAdvanced'
import { RentalIssueAdvanced } from './RentalIssueAdvanced'
import { RentalIssueResults } from './RentalIssueResults'
import { RentalIssueTerms } from './RentalIssueTerms'

export type RentalIssueExpirationParams = {
  tokenDatas: TokenData[]
  rentalCardConfig: RentalCardConfig
  showAdvanced: boolean
  txResults?: IssueTxResult[]
  setTxResults: (r: IssueTxResult[]) => void
}

export const RentalIssueExpiration = ({
  tokenDatas,
  rentalCardConfig,
  showAdvanced,
  txResults,
  setTxResults,
}: RentalIssueExpirationParams) => {
  const [error, setError] = useState<string>()
  const handleIssueRental = useHandleIssueRental()

  const paymentMints = usePaymentMints()
  const paymentMintData = rentalCardConfig.invalidationOptions?.paymentMints
    ? PAYMENT_MINTS.filter(({ mint }) =>
        rentalCardConfig.invalidationOptions?.paymentMints?.includes(mint)
      )
    : PAYMENT_MINTS
  const [paymentAmount, setPaymentAmount] = useState(new BN(0))
  const [paymentMint, setPaymentMint] = useState<string>(
    paymentMintData[0]!.mint
  )
  const [maxExpiration, setMaxExpiration] = useState<number | undefined>(
    rentalCardConfig.invalidationOptions?.maxDurationAllowed?.value
      ? Date.now() / 1000 +
          rentalCardConfig.invalidationOptions?.maxDurationAllowed?.value
      : undefined
  )

  const [advancedValues, setAdvancedValues] =
    useState<RentalIssueAdvancedValues>()
  const [confirmRentalTerms, setConfirmRentalTerms] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <RentalIssueAdvanced
        rentalCardConfig={rentalCardConfig}
        showAdvanced={showAdvanced}
        defaultInvalidationOption={'return'}
        onChange={(advancedValues) => {
          setAdvancedValues(advancedValues)
        }}
        disableRelisting={true}
      />
      <div className="flex gap-4">
        <div className="w-3/4">
          <div className="mb-1 text-base text-light-0">Rental price</div>
          <MintPriceSelector
            defaultPrice={paymentAmount}
            defaultMint={paymentMint}
            mintDisabled={paymentMintData.length === 1}
            paymentMintData={paymentMintData}
            handleValue={(v) => {
              setPaymentAmount(v.price.value)
              setPaymentMint(v.mint.value)
            }}
          />
        </div>
        <div>
          <div className="mb-1 text-base text-light-0">Expiration</div>
          <DatePicker
            className="rounded-xl bg-dark-4 px-3 py-2 text-base"
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
      {txResults ? (
        <RentalIssueResults txResults={txResults} tokenDatas={tokenDatas} />
      ) : error ? (
        <Alert variant="error" showClose onClick={() => setError(undefined)}>
          {error}
        </Alert>
      ) : (
        <div className="rounded-xl bg-dark-4">
          <div className="flex items-center p-4">
            <div className="flex gap-4">
              <div>
                <SolanaLogo width={24} height={24} />
              </div>
              <div>
                You set the price at{' '}
                {priceAndSymbol(
                  paymentAmount,
                  tryPublicKey(paymentMint),
                  paymentMints.data
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 border-t-[1px] border-border px-8 py-4 text-center text-sm text-medium-3">
            {maxExpiration &&
              `This rental will expire at ${new Date(
                maxExpiration * 1000
              ).toLocaleString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })} on ${new Date(maxExpiration * 1000).toLocaleString('en-US', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit',
              })}.`}
          </div>
        </div>
      )}
      <RentalIssueTerms
        confirmed={confirmRentalTerms}
        onClick={() => {
          setConfirmRentalTerms(!confirmRentalTerms)
          setError(undefined)
        }}
      />
      <Button
        variant="primary"
        className="h-12"
        disabled={!confirmRentalTerms || !!error || !!error || !maxExpiration}
        loading={handleIssueRental.isLoading}
        onClick={async () => {
          txResults?.length === 0 && !txResults[0]?.error
            ? handleCopy(txResults[0]?.claimLink ?? '')
            : handleIssueRental.mutate(
                {
                  tokenDatas: tokenDatas,
                  rentalCardConfig,
                  paymentAmount,
                  paymentMint,
                  maxExpiration: maxExpiration,
                  durationSeconds: undefined,
                  extensionPaymentMint: undefined,
                  extensionPaymentAmount: undefined,
                  extensionDurationSeconds: undefined,
                  totalUsages: undefined,
                  invalidationType: advancedValues?.invalidationType,
                  visibility: advancedValues?.visibility,
                  customInvalidator: undefined,
                  disablePartialExtension: undefined,
                  claimRentalReceipt: undefined,
                  rentalType: 'expiration',
                },
                {
                  onSuccess: (txData) => {
                    setTxResults(txData)
                  },
                  onError: (e) => {
                    setError(`${e}`)
                    setConfirmRentalTerms(false)
                  },
                }
              )
        }}
      >
        {txResults?.length === 0 ? (
          <div className="flex items-center justify-center gap-[5px] text-base">
            <FaLink />
            Copy link
          </div>
        ) : (
          <div className="flex items-center justify-center gap-[5px] text-base">
            {advancedValues?.visibility === 'private'
              ? 'Get private link'
              : 'List for rent'}
            <FiSend />
          </div>
        )}
      </Button>
    </div>
  )
}
