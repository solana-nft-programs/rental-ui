import { css } from '@emotion/react'
import { BN } from '@project-serum/anchor'
import { Selector } from 'common/Selector'
import { fmtMintAmount, parseMintNaturalAmountFromDecimal } from 'common/units'
import { PAYMENT_MINTS, usePaymentMints } from 'hooks/usePaymentMints'

export const MintPriceSelector = ({
  price,
  mint,
  paymentMintData,
  disabled,
  mintDisabled,
  handlePrice,
  handleMint,
}: {
  price: number
  mint: string
  paymentMintData: {
    mint: string
    symbol: string
  }[]
  disabled?: boolean
  mintDisabled?: boolean
  handlePrice: (p: number) => void
  handleMint: (m: string) => void
}) => {
  const paymentMintInfos = usePaymentMints()
  const paymentMintInfo = paymentMintInfos.data
    ? paymentMintInfos.data[mint]
    : null

  return (
    <div className="relative flex w-full items-center gap-2">
      <input
        className="w-full rounded-md border border-border bg-dark-4 py-2 px-3 text-light-0 placeholder-medium-3 focus:border-primary focus:outline-none"
        css={css`
          line-height: 20px;
        `}
        type="number"
        placeholder={'Price'}
        disabled={disabled}
        min={0}
        value={
          paymentMintInfo
            ? `${fmtMintAmount(paymentMintInfo, new BN(price))}`
            : '0'
        }
        onChange={(e) =>
          handlePrice(
            parseMintNaturalAmountFromDecimal(
              e.target.value,
              paymentMintInfo?.decimals || 1
            )
          )
        }
      />
      {paymentMintData.length > 1 ? (
        <Selector<string>
          disabled={mintDisabled}
          defaultOption={{
            value:
              paymentMintData.find((m) => m.mint === mint)?.mint ||
              (paymentMintData[0] || PAYMENT_MINTS[0])!.mint,
            label:
              paymentMintData.find((m) => m.mint === mint)?.symbol ||
              (paymentMintData[0] || PAYMENT_MINTS[0])!.symbol,
          }}
          onChange={(e) => handleMint(e.value)}
          options={(paymentMintData || PAYMENT_MINTS).map(
            ({ mint, symbol }) => ({ label: symbol, value: mint })
          )}
        />
      ) : (
        <div className="absolute right-3">{paymentMintData[0]?.symbol}</div>
      )}
    </div>
  )
}
