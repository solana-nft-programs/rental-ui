import { pubKeyUrl, shortPubKey, tryPublicKey } from '@cardinal/common'
import { claimLinks } from '@cardinal/token-manager'
import { css } from '@emotion/react'
import type { TokenData } from 'api/api'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { handleCopy } from 'components/Browse'
import { useHandleIssueRental } from 'handlers/useHandleIssueRental'
import { useWalletId } from 'hooks/useWalletId'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { getLink } from 'providers/ProjectConfigProvider'
import { useState } from 'react'
import { FaLink } from 'react-icons/fa'
import { FiSend } from 'react-icons/fi'
import type { RentalCardConfig } from 'rental-components/components/RentalIssueCard'

import type { RentalIssueAdvancedValues } from './RentalIssueAdvanced'
import { RentalIssueAdvanced } from './RentalIssueAdvanced'
import { RentalIssueTerms } from './RentalIssueTerms'

export type RentalIssueManualParams = {
  tokenDatas: TokenData[]
  rentalCardConfig: RentalCardConfig
  showAdvanced: boolean
}

export const RentalIssueManual = ({
  tokenDatas,
  rentalCardConfig,
  showAdvanced,
}: RentalIssueManualParams) => {
  const { environment } = useEnvironmentCtx()
  const [error, setError] = useState<string>()
  const [link, setLink] = useState<string | null>()
  const handleIssueRental = useHandleIssueRental()
  const [customInvalidator, setCustomInvalidator] = useState<string>()
  const walletId = useWalletId()

  const [advancedValues, setAdvancedValues] =
    useState<RentalIssueAdvancedValues>()
  const [confirmRentalTerms, setConfirmRentalTerms] = useState(false)
  const [totalListed, setTotalListed] = useState(0)

  return (
    <div className="flex flex-col gap-4">
      <RentalIssueAdvanced
        rentalCardConfig={rentalCardConfig}
        showAdvanced={showAdvanced}
        onChange={(advancedValues) => {
          setAdvancedValues(advancedValues)
        }}
      />
      <div>
        <div className="mb-1 text-base text-light-0">
          Manual revocation pubkey
        </div>
        <div className="relative flex">
          <input
            className="w-full rounded-xl border border-border bg-dark-4 py-2 px-3 text-light-0 placeholder-medium-3 transition-all focus:border-primary focus:outline-none"
            value={customInvalidator}
            placeholder={'Enter a Solana address...'}
            onChange={(e) => setCustomInvalidator(e.target.value)}
          />
          <Button
            variant={'primary'}
            className="absolute right-0 top-[1px] w-16 rounded-xl"
            css={css`
              height: calc(100% - 2px);
            `}
            onClick={() =>
              setCustomInvalidator(walletId?.toString() ?? undefined)
            }
          >
            Me
          </Button>
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
        customInvalidator && (
          <div className="rounded-xl bg-dark-4">
            <div className="flex border-border py-4 px-8 text-center text-sm text-medium-3">
              This rental will last{' '}
              <>
                until
                {
                  <a
                    target="_blank"
                    rel="noreferrer"
                    className="mx-[3px]"
                    href={pubKeyUrl(
                      tryPublicKey(customInvalidator),
                      environment.label
                    )}
                  >
                    {shortPubKey(customInvalidator)}
                  </a>
                }
                revokes it
              </>
            </div>
          </div>
        )
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
          !customInvalidator
        }
        loading={handleIssueRental.isLoading}
        onClick={async () => {
          link
            ? handleCopy(link)
            : handleIssueRental.mutate(
                {
                  tokenDatas: tokenDatas,
                  rentalCardConfig,
                  paymentAmount: undefined,
                  paymentMint: undefined,
                  maxExpiration: undefined,
                  durationSeconds: undefined,
                  extensionPaymentMint: undefined,
                  extensionPaymentAmount: undefined,
                  extensionDurationSeconds: undefined,
                  totalUsages: undefined,
                  invalidationType: advancedValues?.invalidationType,
                  visibility: advancedValues?.visibility,
                  customInvalidator: customInvalidator,
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
