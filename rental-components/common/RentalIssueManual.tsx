import { pubKeyUrl, shortPubKey, tryPublicKey } from '@cardinal/common'
import { css } from '@emotion/react'
import type { TokenData } from 'apis/api'
import { Alert } from 'common/Alert'
import { Button } from 'common/Button'
import { handleCopy } from 'components/Browse'
import { useHandleIssueRental } from 'handlers/useHandleIssueRental'
import { useWalletId } from 'hooks/useWalletId'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useState } from 'react'
import { FaLink } from 'react-icons/fa'
import { FiSend } from 'react-icons/fi'
import type {
  RentalCardConfig,
  TxResult,
} from 'rental-components/components/RentalIssueCard'

import type { RentalIssueAdvancedValues } from './RentalIssueAdvanced'
import { RentalIssueAdvanced } from './RentalIssueAdvanced'
import { RentalIssueTerms } from './RentalIssueTerms'

export type RentalIssueManualParams = {
  tokenDatas: TokenData[]
  rentalCardConfig: RentalCardConfig
  showAdvanced: boolean
  setTxResults: (r: TxResult[]) => void
}

export const RentalIssueManual = ({
  tokenDatas,
  rentalCardConfig,
  showAdvanced,
  setTxResults,
}: RentalIssueManualParams) => {
  const { environment } = useEnvironmentCtx()
  const [error, setError] = useState<string>()
  const [txData, setTxData] = useState<TxResult[]>()
  const handleIssueRental = useHandleIssueRental()
  const [customInvalidator, setCustomInvalidator] = useState<string>()
  const walletId = useWalletId()

  const [advancedValues, setAdvancedValues] =
    useState<RentalIssueAdvancedValues>()
  const [confirmRentalTerms, setConfirmRentalTerms] = useState(false)

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
      {txData && txData.length === tokenDatas.length ? (
        <Alert variant="success" className="text-left">
          {txData.length === 1 ? (
            <div>
              Successfully listed {tokenDatas[0]?.metaplexData?.data.data.name}
              <br />
              {advancedValues?.visibility === 'private' && (
                <>
                  {txData[0]?.claimLink.substring(0, 20)}
                  <div>
                    This link can only be used once and cannot be regenerated
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              {' '}
              Successfully listed: ({txData.length} / {tokenDatas.length}){' '}
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
        disabled={!confirmRentalTerms || !!error || !customInvalidator}
        loading={handleIssueRental.isLoading}
        onClick={async () => {
          txData
            ? handleCopy(txData[0]?.claimLink ?? '')
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
                  onSuccess: (txData) => {
                    setTxResults(txData)
                    setTxData(txData)
                  },
                  onError: (e) => {
                    setError(`${e}`)
                    setConfirmRentalTerms(false)
                  },
                }
              )
        }}
      >
        {txData?.length === 0 ? (
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
