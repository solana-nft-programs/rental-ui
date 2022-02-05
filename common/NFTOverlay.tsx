import * as anchor from '@project-serum/anchor'
import styled from '@emotion/styled'
import { Extendable, Returnable, Revocable } from 'common/icons'
import { fmtMintAmount } from 'common/units'
import * as utils from 'common/utils'
import { useUTCNow } from 'providers/UTCNowProvider'
import { PAYMENT_MINTS, usePaymentMints } from 'providers/PaymentMintsProvider'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { useEffect, useState } from 'react'

const StyledOverlay = styled.div<{
  height?: string
  maxWidth?: string
  lineHeight?: number
  shadow?: boolean
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
      ? 'linear-gradient(rgba(26, 27, 32, 0.2) 60%,rgba(26, 27, 32, 0.4),rgba(26, 27, 32, 1) 90%)'
      : 'none'};
  border-radius: 10px;
  z-index: 2;
  // outline: 6px solid black;

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

interface NFTOverlayProps {
  shadow?: boolean
  state?: TokenManagerState
  paymentAmount?: number
  paymentMint?: string
  expiration?: number
  usages?: number
  maxUsages?: number
  revocable?: boolean
  extendable?: boolean
  returnable?: boolean
  lineHeight?: number
}

function getBoxShadow(
  state: TokenManagerState,
  expiration: number | undefined,
  usages: number | undefined,
  maxUsages: number | undefined,
  lineHeight: number
) {
  if (
    state === TokenManagerState.Invalidated ||
    (maxUsages && usages && usages >= maxUsages) ||
    (expiration && expiration <= Math.floor(Date.now() / 1000))
  ) {
    return `0 0 ${0.4 * lineHeight}px ${0.4 * lineHeight}px rgba(125, 0, 0, 1)`
  } else if (state === TokenManagerState.Issued) {
    return `0 0 ${0.4 * lineHeight}px ${0.4 * lineHeight}px #593815`
  } else if (state === TokenManagerState.Claimed) {
    return `0 0 ${0.4 * lineHeight}px ${0.4 * lineHeight}px #274916`
  } else {
    return `0 0 ${0.4 * lineHeight}px ${
      0.4 * lineHeight
    }px rgba(255, 255, 255, 0.3)`
  }
}

export function NFTOverlay({
  shadow = true,
  state = 0,
  paymentAmount,
  paymentMint,
  expiration,
  usages,
  maxUsages,
  revocable,
  extendable,
  returnable,
  lineHeight = 20,
}: NFTOverlayProps) {
  // const { UTCNow } = useUTCNow()
  const { paymentMintInfos } = usePaymentMints()
  const [UTCNow, setUTCNow] = useState(Date.now() / 1000)
  useEffect(() => {
    const interval = setInterval(
      (function expirationStringUpdate() {
        setUTCNow(Math.floor(Date.now() / 1000))
        return expirationStringUpdate
      })(),
      1000
    )
    return () => clearInterval(interval)
  })
  return (
    <StyledOverlay
      shadow={shadow}
      lineHeight={lineHeight}
      style={{
        boxShadow: getBoxShadow(
          state,
          expiration,
          usages,
          maxUsages,
          lineHeight
        ),
      }}
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
        {usages != undefined && (
          <div className="expiration">
            Used ({usages?.toString() || 0}
            {maxUsages && ` / ${maxUsages.toString()}`})
          </div>
        )}
      </div>
      <div className="logo">
        <img src="/assets/cardinal-crosshair.svg"></img>
      </div>
    </StyledOverlay>
  )
}
