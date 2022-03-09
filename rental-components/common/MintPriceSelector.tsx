import React from 'react'
import styled from '@emotion/styled'
import { BN } from '@project-serum/anchor'
import { InputNumber, Select } from 'antd'
import { fmtMintAmount, parseMintNaturalAmountFromDecimal } from 'common/units'
import { usePaymentMints, PAYMENT_MINTS } from 'providers/PaymentMintsProvider'
const { Option } = Select

export const MintPriceSelector = ({
  price,
  mint,
  disabled,
  mintDisabled,
  handlePrice,
  handleMint,
}: {
  price: number
  mint: string
  disabled?: boolean
  mintDisabled?: boolean
  handlePrice: (p: number) => void
  handleMint: (m: string) => void
}) => {
  const { paymentMintInfos } = usePaymentMints()
  const paymentMintInfo = paymentMintInfos[mint]

  return (
    <SelectorOuter>
      <InputNumber
        className="rounded-[4px]"
        style={{ width: '100%' }}
        placeholder="Price"
        stringMode
        disabled={disabled}
        value={
          paymentMintInfo ? fmtMintAmount(paymentMintInfo, new BN(price)) : '0'
        }
        min="0"
        step={1 / 10 ** 4}
        onChange={(e) =>
          handlePrice(
            parseMintNaturalAmountFromDecimal(e, paymentMintInfo?.decimals || 1)
          )
        }
      />
      <Select
        style={{ borderRadius: '100px', zIndex: 99990 }}
        onChange={(e) => handleMint(e)}
        defaultValue={PAYMENT_MINTS[0].mint}
        disabled={disabled || mintDisabled}
      >
        {PAYMENT_MINTS.map(
          ({ mint, symbol }) =>
            paymentMintInfos[mint] && (
              <Option key={mint} value={mint}>
                {symbol}
              </Option>
            )
        )}
      </Select>
    </SelectorOuter>
  )
}

const SelectorOuter = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`
