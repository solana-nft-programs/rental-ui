import type { AccountData } from '@cardinal/common'
import {
  getExpirationString,
  secondsToString,
  shortPubKey,
  tryPublicKey,
} from '@cardinal/common'
import { DisplayAddress } from '@cardinal/namespaces-components'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type * as splToken from '@solana/spl-token'
import type { TokenData } from 'apis/api'
import {
  getPriceFromTokenData,
  getPriceOrRentalRate,
  getSymbolFromTokenData,
  getTokenMaxDuration,
  getTokenRentalRate,
  isPrivateListing,
  isRateBasedListing,
  rentalType,
  rentalTypeColor,
} from 'common/tokenDataUtils'
import type { ProjectConfig } from 'config/config'
import { useOtp } from 'hooks/useOtp'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useTokenAccountInfo } from 'hooks/useTokenAccountInfo'
import { useWalletId } from 'hooks/useWalletId'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'
import { FiCheck } from 'react-icons/fi'

import { Tooltip } from './Tooltip'

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
          Fixed duration:{' '}
          <b>
            {tokenData.timeInvalidator?.parsed.durationSeconds.toNumber()
              ? secondsToString(
                  tokenData.timeInvalidator?.parsed.durationSeconds.toNumber(),
                  false
                )
              : '0'}
          </b>
        </p>
      ) : tokenData.timeInvalidator?.parsed.expiration &&
        tokenData.tokenManager?.parsed.state === TokenManagerState.Claimed ? (
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

export const getRentalRateDisplayText = (
  config: ProjectConfig,
  tokenData: {
    timeInvalidator?: AccountData<
      Pick<
        TimeInvalidatorData,
        | 'durationSeconds'
        | 'expiration'
        | 'maxExpiration'
        | 'extensionDurationSeconds'
        | 'extensionPaymentAmount'
        | 'extensionPaymentMint'
      >
    > | null
    claimApprover?: AccountData<
      Pick<PaidClaimApproverData, 'paymentAmount' | 'paymentMint'>
    > | null
  },
  paymentMints?: { [name: string]: Pick<splToken.MintInfo, 'decimals'> },
  accentColor = 'text-light-2'
) => {
  return isRateBasedListing(tokenData) ? (
    <>
      {getTokenRentalRate(config, paymentMints ?? {}, tokenData)?.displayText}
    </>
  ) : (
    <>
      {getPriceFromTokenData(tokenData, paymentMints)}{' '}
      {getSymbolFromTokenData(tokenData)}
      <span className={accentColor}>
        {' '}
        ={' '}
        {Number(
          getPriceOrRentalRate(config, tokenData, paymentMints).toFixed(4)
        )}{' '}
        {getSymbolFromTokenData(tokenData)} /{' '}
        {(config.marketplaceRate ?? 'days').slice(0, -1)}
      </span>
    </>
  )
}

interface NFTIssuerInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: Pick<
    TokenData,
    'tokenManager' | 'recipientTokenAccount' | 'timeInvalidator'
  >
}

export const NFTIssuerInfo: React.FC<NFTIssuerInfoProps> = ({
  tokenData,
}: NFTIssuerInfoProps) => {
  const { UTCNow } = useUTCNow()
  const { secondaryConnection } = useEnvironmentCtx()
  const { config } = useProjectConfig()
  const otpKeypair = useOtp()
  const paymentMints = usePaymentMints()
  const walletId = useWalletId()
  const isPrivateApproved =
    isPrivateListing(tokenData) &&
    (otpKeypair?.publicKey.toString() ===
      tokenData.tokenManager?.parsed.claimApprover?.toString() ||
      tokenData.tokenManager?.parsed.claimApprover?.toString() ===
        walletId?.toString())
  const recipientTokenAccountInfo = useTokenAccountInfo(
    tokenData.tokenManager?.parsed.state === TokenManagerState.Claimed &&
      !tokenData.recipientTokenAccount
      ? tokenData.tokenManager.parsed.recipientTokenAccount
      : undefined
  )
  return (
    <div>
      {tokenData.tokenManager?.parsed.state === TokenManagerState.Claimed && (
        <div className="flex flex-col text-secondary">
          <div className="flex">
            <div>Claimed by&nbsp;</div>
            <DisplayAddress
              dark
              connection={secondaryConnection}
              address={
                tryPublicKey(
                  tokenData.recipientTokenAccount?.parsed.owner ??
                    recipientTokenAccountInfo.data?.parsed.owner
                ) ?? undefined
              }
            />
          </div>
        </div>
      )}
      {isPrivateListing(tokenData) &&
      tokenData.tokenManager?.parsed.state === TokenManagerState.Issued ? (
        <Tooltip
          title={
            isPrivateApproved
              ? 'You are approved to claim this private rental'
              : `This rental is private and only recipients specified by ${shortPubKey(
                  tokenData.tokenManager.parsed.claimApprover
                )} can claim.`
          }
        >
          {isPrivateListing(tokenData) && isPrivateApproved ? (
            <div className="my-auto flex cursor-default items-center gap-1 rounded-lg bg-gray-800 px-3 py-2 text-secondary">
              {isPrivateApproved && (
                <div className="text-base text-secondary">
                  <FiCheck />
                </div>
              )}
              Approved
            </div>
          ) : (
            <div className="my-auto flex cursor-default items-center gap-1 rounded-lg bg-gray-800 px-5 py-2 text-white">
              Private
            </div>
          )}
        </Tooltip>
      ) : (
        <div className="flex flex-col text-light-2">
          {tokenData.tokenManager?.parsed.state !==
            TokenManagerState.Claimed && (
            <div className={`${rentalTypeColor(rentalType(tokenData))}`}>
              {getDurationText(tokenData, UTCNow)}
            </div>
          )}
          <div className="text-light-0">
            {getRentalRateDisplayText(config, tokenData, paymentMints.data)}{' '}
          </div>
        </div>
      )}
    </div>
  )
}
