import { tryPublicKey } from '@cardinal/common'
import { claimLinks } from '@cardinal/token-manager'
import { css } from '@emotion/react'
import { BN } from '@project-serum/anchor'
import { DatePicker } from 'antd'
import type { TokenData } from 'api/api'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { priceAndSymbol } from 'common/NFTClaimButton'
import { handleCopy } from 'components/Browse'
import { useHandleIssueRental } from 'handlers/useHandleIssueRental'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { getLink } from 'providers/ProjectConfigProvider'
import { useState } from 'react'
import { FaLink } from 'react-icons/fa'
import { FiSend } from 'react-icons/fi'
import { PAYMENT_MINTS } from 'rental-components/common/Constants'
import { MintPriceSelector } from 'rental-components/common/MintPriceSelector'
import type { RentalCardConfig } from 'rental-components/components/RentalIssueCard'

import { SolanaLogo } from './icons'
import type { RentalIssueAdvancedValues } from './RentalIssueAdvanced'
import { RentalIssueAdvanced } from './RentalIssueAdvanced'
import { RentalIssueTerms } from './RentalIssueTerms'

export type RentalIssueExpirationParams = {
  tokenDatas: TokenData[]
  rentalCardConfig: RentalCardConfig
  showAdvanced: boolean
}

export const RentalIssueExpiration = ({
  tokenDatas,
  rentalCardConfig,
  showAdvanced,
}: RentalIssueExpirationParams) => {
  const { environment } = useEnvironmentCtx()
  const [error, setError] = useState<string>()
  const [link, setLink] = useState<string | null>()
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
  const [totalListed, setTotalListed] = useState(0)

  console.log(paymentAmount.toString())
  return (
    <div className="flex flex-col gap-4">
      <RentalIssueAdvanced
        rentalCardConfig={rentalCardConfig}
        showAdvanced={showAdvanced}
        onChange={(advancedValues) => {
          setAdvancedValues(advancedValues)
        }}
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
      {link ? (
        <Alert variant="success" className="text-left">
          {tokenDatas.length === 1 && totalListed === 1 ? (
            <div>
              Successfully listed: ({totalListed} / {tokenDatas.length})
              <br />
              Link created {link.substring(0, 20)}
              ...
              {advancedValues?.visibility === 'private' && (
                <>
                  {link.substring(link.length - 5)}
                  <div>
                    This link can only be used once and cannot be regenerated
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              {' '}
              Successfully listed: ({totalListed} / {tokenDatas.length}){' '}
            </div>
          )}
        </Alert>
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
          <div className="flex gap-3 border-t-[1px] border-border py-4 px-8 text-center text-sm text-medium-3">
            {maxExpiration &&
              `This rental will be expire at  ${new Date(
                maxExpiration * 1000
              ).toLocaleString('en-US')}.`}
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
        disabled={
          !confirmRentalTerms ||
          (link === 'success' &&
            (totalListed === tokenDatas.length || tokenDatas.length === 0)) ||
          !!error ||
          !maxExpiration
        }
        loading={handleIssueRental.isLoading}
        onClick={async () => {
          link
            ? handleCopy(link)
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
                },
                {
                  onSuccess: ({
                    otpKeypairs,
                    tokenManagerIds,
                    totalSuccessfulTransactions,
                  }) => {
                    setTotalListed(totalSuccessfulTransactions)
                    if (tokenDatas.length === 1 && tokenManagerIds[0]) {
                      const link = claimLinks.getLink(
                        tokenManagerIds[0],
                        otpKeypairs[0],
                        environment.label,
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
