import type { TokenData } from 'apis/api'
import { Alert } from 'common/Alert'
import { handleCopy } from 'common/NFTHeader'
import type { IssueTxResult } from 'handlers/useHandleIssueRental'

export const RentalIssueResults = ({
  txResults,
  tokenDatas,
}: {
  txResults: IssueTxResult[]
  tokenDatas: TokenData[]
}) => {
  const [successfulListings, errorListings] = txResults.reduce(
    (acc, txResult) =>
      txResult.txid
        ? [[...acc[0], txResult], acc[1]]
        : [acc[0], [...acc[1], txResult]],
    [[], []] as [IssueTxResult[], IssueTxResult[]]
  )
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <div className="text-base text-medium-3">
        Successfully listed: ({txResults.filter(({ txid }) => txid).length} /{' '}
        {tokenDatas.length}){' '}
      </div>
      {txResults.some((v) => v.otpKeypair) && (
        <div className="mb-2 text-yellow-500">
          Private links generated below include claim password in the link.
          These can only be used once and cannot be regenerated.
        </div>
      )}
      {successfulListings.map((txResult, i) => (
        <Alert
          key={i}
          variant="success"
          className="cursor-pointer"
          onClick={() => handleCopy(txResult.claimLink)}
        >
          <div className="">
            Success ({i + 1}/{txResults.length}): Click
            <div className="text-blue-500 mx-1 inline-block">here</div>to copy{' '}
            {txResult.otpKeypair && (
              <span className="text-yellow-500">private </span>
            )}
            claim link
          </div>
        </Alert>
      ))}
      {errorListings.map(({ error }, i) => (
        <Alert variant="error" key={i}>
          Error ({i + 1}/{txResults.length}): {error}
        </Alert>
      ))}
    </div>
  )
}
