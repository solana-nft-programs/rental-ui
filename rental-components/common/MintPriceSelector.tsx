import styled from '@emotion/styled'
import { BN } from '@project-serum/anchor'
import { InputNumber, Select } from 'antd'
import { fmtMintAmount, parseMintNaturalAmountFromDecimal } from 'common/units'
import { PAYMENT_MINTS, usePaymentMints } from 'hooks/usePaymentMints'
import React from 'react'

const { Option } = Select

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
        onChange={(e) => handleMint(e)}
        defaultValue={paymentMintData[0]?.symbol ?? PAYMENT_MINTS[0]!.symbol}
        disabled={disabled || mintDisabled}
        showArrow={!mintDisabled}
      >
        {(paymentMintData ?? PAYMENT_MINTS).map(
          ({ mint, symbol }) =>
            paymentMintInfos.data &&
            paymentMintInfos.data[mint] && (
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

  .ant-select-selector {
    border-radius: 4px;
  }
`
