import { getExpirationString, secondsToString } from '@cardinal/common'
import { DisplayAddress } from '@cardinal/namespaces-components'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { css } from '@emotion/react'
import { BN } from '@project-serum/anchor'
import type { TokenData } from 'apis/api'
import { getTokenMaxDuration } from 'components/Browse'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useUTCNow } from 'providers/UTCNowProvider'

import { stateColor } from './NFT'

export const isPrivateListing = (tokenData: TokenData) =>
  tokenData.tokenManager?.parsed.claimApprover && !tokenData.claimApprover

export const isRateBasedListing = (tokenData: TokenData) =>
  !!tokenData.timeInvalidator?.parsed.durationSeconds &&
  tokenData.timeInvalidator?.parsed.durationSeconds.eq(new BN(0)) &&
  !!tokenData.timeInvalidator?.parsed.extensionDurationSeconds

export const getDurationText = (tokenData: TokenData, UTCNow: number) => {
  return tokenData.timeInvalidator?.parsed ? (
    <div className="float-left">
      {isRateBasedListing(tokenData) ? (
        <p
          className={`float-left inline-block text-ellipsis whitespace-nowrap`}
        >
          Max: <b>{getTokenMaxDuration(tokenData, UTCNow).displayText}</b>
        </p>
      ) : tokenData.timeInvalidator?.parsed.durationSeconds ? (
        <p className="float-left inline-block text-ellipsis whitespace-nowrap">
          Fixed Duration:{' '}
          <b>
            {tokenData.timeInvalidator?.parsed.durationSeconds.toNumber()
              ? secondsToString(
                  tokenData.timeInvalidator?.parsed.durationSeconds.toNumber(),
                  false
                )
              : '∞'}
          </b>
        </p>
      ) : tokenData.timeInvalidator?.parsed.expiration ? (
        <p className="float-left inline-block text-ellipsis whitespace-nowrap">
          Expires:{' '}
          <b>
            {getExpirationString(
              tokenData.timeInvalidator?.parsed.expiration?.toNumber(),
              UTCNow
            )}
          </b>
        </p>
      ) : tokenData.timeInvalidator?.parsed.maxExpiration ? (
        <p className="float-left inline-block text-ellipsis whitespace-nowrap">
          Expires:{' '}
          <b>
            {getExpirationString(
              tokenData.timeInvalidator?.parsed.maxExpiration?.toNumber(),
              UTCNow
            )}
          </b>
        </p>
      ) : null}
    </div>
  ) : null
}

interface NFTIssuerInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData
}

export const NFTIssuerInfo: React.FC<NFTIssuerInfoProps> = ({
  tokenData,
}: NFTIssuerInfoProps) => {
  const { UTCNow } = useUTCNow()
  const { secondaryConnection } = useEnvironmentCtx()
  return (
    <div>
      {tokenData.tokenManager?.parsed.state === TokenManagerState.Issued ? (
        isPrivateListing(tokenData) ? (
          <div className="my-auto rounded-lg bg-gray-800 px-5 py-2 text-white">
            Private
          </div>
        ) : (
          <div
            className="flex flex-col"
            css={css`
              color: ${stateColor(TokenManagerState.Issued, true)};
            `}
          >
            <div>{getDurationText(tokenData, UTCNow)}</div>
            <DisplayAddress
              connection={secondaryConnection}
              address={tokenData.tokenManager?.parsed.issuer || undefined}
              height="18px"
              width="100px"
              dark={true}
            />
          </div>
        )
      ) : (
        tokenData.recipientTokenAccount?.owner && (
          <div
            className="flex flex-col"
            css={css`
              color: ${stateColor(TokenManagerState.Claimed, true)};
            `}
          >
            <div className="flex">
              <div>Claimed by&nbsp;</div>
              <DisplayAddress
                connection={secondaryConnection}
                address={tokenData.recipientTokenAccount?.owner}
                height="18px"
                width="100px"
                dark={true}
              />
            </div>
            <div className="flex">
              <div>Issued by&nbsp;</div>
              <DisplayAddress
                connection={secondaryConnection}
                address={tokenData.tokenManager?.parsed.issuer}
                height="18px"
                width="100px"
                dark={true}
              />
            </div>
          </div>
        )
      )}
    </div>
  )
}
