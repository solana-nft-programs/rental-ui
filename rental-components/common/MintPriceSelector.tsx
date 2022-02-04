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
  handlePrice,
  handleMint,
}: {
  price: number
  mint: string
  handlePrice: (number) => void
  handleMint: (string) => void
}) => {
  const { paymentMintInfos } = usePaymentMints()
  const paymentMintInfo = paymentMintInfos[mint]
  return (
    <SelectorOuter>
      <InputNumber
        placeholder="Price"
        stringMode
        value={
          paymentMintInfo ? fmtMintAmount(paymentMintInfo, new BN(price)) : '0'
        }
        min="0"
        step={1 / 10 ** (paymentMintInfo?.decimals || 1)}
        onChange={(e) =>
          handlePrice(
            parseMintNaturalAmountFromDecimal(e, paymentMintInfo?.decimals || 1)
          )
        }
      />
      <Select
        onChange={(e) => handleMint(e)}
        defaultValue={PAYMENT_MINTS[0].mint}
      >
        {PAYMENT_MINTS.map(({ mint, symbol }) => (
          <Option key={mint} value={mint}>
            {symbol}
          </Option>
        ))}
      </Select>
    </SelectorOuter>
  )
}

const SelectorOuter = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  div,
  .ant-select-selector {
    border-radius: 4px !important;
  }
`
