import {
  InvalidationType,
  TokenManagerState,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import styled from '@emotion/styled'
import * as anchor from '@project-serum/anchor'
import type { TokenData } from 'api/api'
import { Extendable, Returnable, Revocable } from 'common/icons'
import { fmtMintAmount } from 'common/units'
import * as utils from 'common/utils'
import { PAYMENT_MINTS, usePaymentMints } from 'providers/PaymentMintsProvider'
import { useUTCNow } from 'providers/UTCNowProvider'

const StyledOverlay = styled.div<{
  height?: string
  maxWidth?: string
  lineHeight?: number
  shadow?: boolean
  borderRadius?: number
}>`
  bottom: 0;
  position: absolute;
  width: 100%;
  max-width: ${({ maxWidth }) => maxWidth || '100%'};
  height: ${({ height }) => height || '100%'};
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 15px 15px rgba(255, 255, 255, 0.2);
  font-size: ${({ lineHeight }) => lineHeight}px;

  background: ${({ shadow }) =>
    shadow
      ? 'linear-gradient(rgba(26, 27, 32, 0.2) 70%,rgba(26, 27, 32, 0.4),rgba(26, 27, 32, 0.6) 100%)'
      : 'none'};

  z-index: 2;
  // outline: 6px solid black;
  border-radius: ${({ borderRadius }) => borderRadius}px;
  .top-right {
    position: absolute;
    top: 4%;
    left: 4%;
    width: 50%;
    display: flex;
    gap: 10px;

    .badge {
      svg {
        height: auto;
        width: ${({ lineHeight }) => (lineHeight ? 1.5 * lineHeight : 10)}px;
      }
    }
  }

  .top-right {
    position: absolute;
    top: 4%;
    right: 4%;
  }

  .bottom-left {
    position: absolute;
    bottom: 4%;
    left: 4%;
    text-align: left;
  }

  .logo {
    position: absolute;
    bottom: 4%;
    right: 4%;
    width: 12%;
  }

  .expiration {
    color: white;
  }
`

export const stateColor = (state: TokenManagerState, light = false): string => {
  if (state === TokenManagerState.Invalidated) {
    return 'rgba(125, 0, 0, 1)'
  } else if (state === TokenManagerState.Issued) {
    return light ? '#d89614' : '#593815'
  } else if (state === TokenManagerState.Claimed) {
    return light ? '#52c41a' : '#274916'
  } else {
    return 'rgba(255, 255, 255, 0.3)`'
  }
}

function getBoxShadow(
  state: TokenManagerState,
  expiration: number | undefined,
  usages: number | undefined,
  totalUsages: number | undefined,
  lineHeight: number
) {
  return '0 0 0 0'
  // if (
  //   state === TokenManagerState.Invalidated ||
  //   (totalUsages && usages && usages >= totalUsages) ||
  //   (expiration && expiration <= Math.floor(Date.now() / 1000))
  // ) {
  //   return `0 0 ${0.4 * lineHeight}px ${0.4 * lineHeight}px ${stateColor(
  //     TokenManagerState.Invalidated
  //   )}`
  // } else if (state === TokenManagerState.Issued) {
  //   return `0 0 ${0.4 * lineHeight}px ${0.4 * lineHeight}px ${stateColor(
  //     TokenManagerState.Issued
  //   )}`
  // } else if (state === TokenManagerState.Claimed) {
  //   return `0 0 ${0.4 * lineHeight}px ${0.4 * lineHeight}px ${stateColor(
  //     TokenManagerState.Claimed
  //   )}`
  // } else {
  //   return `0 0 ${0.4 * lineHeight}px ${0.4 * lineHeight}px ${stateColor(
  //     state
  //   )}`
  // }
}

export function TokenDataOverlay({
  tokenData,
  lineHeight,
  borderRadius,
}: {
  tokenData: TokenData
  lineHeight: number
  borderRadius: number
}) {
  return (
    <NFTOverlay
      state={tokenData.tokenManager?.parsed.state}
      returnable={
        tokenData.tokenManager?.parsed.invalidationType ===
        InvalidationType.Return
      }
      expiration={
        tokenData.timeInvalidator?.parsed.expiration?.toNumber() || undefined
      }
      durationSeconds={
        tokenData.timeInvalidator?.parsed?.durationSeconds?.toNumber() ||
        undefined
      }
      stateChangedAt={
        tokenData.tokenManager?.parsed.stateChangedAt?.toNumber() || undefined
      }
      paymentMint={tokenData.claimApprover?.parsed.paymentMint.toString()}
      paymentAmount={tokenData.claimApprover?.parsed.paymentAmount.toNumber()}
      usages={tokenData.useInvalidator?.parsed.usages.toNumber()}
      totalUsages={tokenData.useInvalidator?.parsed.totalUsages?.toNumber()}
      lineHeight={lineHeight}
      borderRadius={borderRadius}
    />
  )
}

interface NFTOverlayProps {
  shadow?: boolean
  state?: TokenManagerState
  paymentAmount?: number
  paymentMint?: string
  expiration?: number
  durationSeconds?: number
  usages?: number
  totalUsages?: number
  revocable?: boolean
  extendable?: boolean
  returnable?: boolean
  lineHeight?: number
  stateChangedAt?: number
  borderRadius?: number
}

export function NFTOverlay({
  shadow = true,
  state = 0,
  paymentAmount,
  paymentMint,
  expiration,
  durationSeconds,
  usages,
  totalUsages,
  revocable,
  extendable,
  returnable,
  stateChangedAt,
  lineHeight = 20,
  borderRadius,
}: NFTOverlayProps) {
  const { UTCNow } = useUTCNow()
  const { paymentMintInfos } = usePaymentMints()

  return (
    <StyledOverlay
      shadow={shadow}
      lineHeight={lineHeight}
      style={{
        boxShadow: getBoxShadow(
          state,
          expiration ||
            (durationSeconds &&
            stateChangedAt &&
            state === TokenManagerState.Claimed
              ? durationSeconds + stateChangedAt
              : undefined),
          usages,
          totalUsages,
          lineHeight
        ),
      }}
      borderRadius={borderRadius ?? 0}
    >
      <div className="top-right">
        {revocable && (
          <div className="badge">
            <Revocable />
          </div>
        )}
        {extendable && (
          <div className="badge">
            <Extendable />
          </div>
        )}
        {returnable && (
          <div className="badge">
            <Returnable />
          </div>
        )}
      </div>
      <div className="top-right"></div>
      <div className="bottom-left">
        {paymentMint &&
          paymentAmount &&
          paymentAmount > 0 &&
          paymentMintInfos &&
          paymentMintInfos[paymentMint.toString()] && (
            <div className="expiration">
              {fmtMintAmount(
                paymentMintInfos[paymentMint.toString()],
                new anchor.BN(paymentAmount)
              )}{' '}
              {PAYMENT_MINTS.find(
                ({ mint }) => mint.toString() === paymentMint.toString()
              )?.symbol || paymentMint.toString()}
            </div>
          )}
        {expiration && (
          <div className="expiration">
            {utils.getExpirationString(expiration, UTCNow)}
          </div>
        )}
        {/* {!expiration &&
          durationSeconds &&
          state !== TokenManagerState.Claimed && (
            <div className="expiration">
              {utils.secondstoDuration(durationSeconds)}
            </div>
          )} */}
        {!expiration &&
          durationSeconds &&
          stateChangedAt &&
          state === TokenManagerState.Claimed && (
            <div className="expiration">
              {utils.getExpirationString(
                stateChangedAt + durationSeconds,
                UTCNow
              )}
            </div>
          )}
        {usages !== undefined && (
          <div className="expiration">
            Used ({usages?.toString() || 0}
            {totalUsages && ` / ${totalUsages.toString()}`})
          </div>
        )}
      </div>
      <div className="logo">
        <img src="/assets/cardinal-crosshair.svg" alt="crosshair"></img>
      </div>
    </StyledOverlay>
  )
}
