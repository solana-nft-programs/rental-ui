import { BN } from '@project-serum/anchor'
import type { Mint } from '@solana/spl-token'
import { BigNumber } from 'bignumber.js'

/// Formats mint amount (natural units) as a decimal string
export function fmtMintAmount(
  mint: Pick<Mint, 'decimals'> | undefined,
  mintAmount: BN
) {
  return mint
    ? getMintDecimalAmount(mint, mintAmount).toFormat()
    : new BigNumber(mintAmount.toString()).toFormat()
}

// Converts mint amount (natural units) to decimals
export function getMintDecimalAmount(
  mint: Pick<Mint, 'decimals'>,
  mintAmount: BN
) {
  return new BigNumber(mintAmount.toString()).shiftedBy(-mint.decimals)
}

// Converts amount in decimals to mint amount (natural units)
export function getMintNaturalAmountFromDecimal(
  decimalAmount: number,
  decimals: number
) {
  return new BigNumber(decimalAmount).shiftedBy(decimals).toNumber()
}
