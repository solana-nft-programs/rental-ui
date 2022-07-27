import { BN } from '@project-serum/anchor'
import type * as splToken from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import type { PublicKey } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { getSymbolFromTokenData, getTokenRentalRate } from 'components/Browse'
import { allowedToRent } from 'handlers/useHandleClaimRental'
import { useOtp } from 'hooks/useOtp'
import { PAYMENT_MINTS, usePaymentMints } from 'hooks/usePaymentMints'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useRentalFixedCard } from 'rental-components/components/RentalFixedCard'
import { useRentalFixedExpirationCard } from 'rental-components/components/RentalFixedExpirationCard'
import { useRentalManualCard } from 'rental-components/components/RentalManualCard'
import { useRentalRateCard } from 'rental-components/components/RentalRateCard'

import { ButtonSmall } from './ButtonSmall'
import { isPrivateListing, isRateBasedListing } from './NFTIssuerInfo'
import { fmtMintAmount } from './units'

export const mintSymbol = (paymentMint: PublicKey | null | undefined) => {
  const symbol = PAYMENT_MINTS.find(
    (mint) => mint.mint === paymentMint?.toString()
  )?.symbol
  if (!symbol || symbol === 'SOL') {
    return '◎'
  } else {
    return symbol
  }
}

export const mintImage = (paymentMint: PublicKey | null | undefined) => {
  return PAYMENT_MINTS.find((mint) => mint.mint === paymentMint?.toString())
    ?.image
}

export const priceAndSymbol = (
  paymentAmount: BN,
  paymentMint: PublicKey | null | undefined,
  paymentMintInfos:
    | {
        [name: string]: splToken.MintInfo
      }
    | undefined
) => {
  if (!paymentMintInfos || !paymentMint) return 'Unknown mint'
  return `${fmtMintAmount(
    paymentMintInfos[paymentMint.toString()],
    paymentAmount ?? new BN(0)
  )}${mintSymbol(paymentMint)}`
}

interface NFTClaimButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData
  tokenDatas?: TokenData[]
}

export const NFTClaimButton: React.FC<NFTClaimButtonProps> = ({
  tokenData,
  tokenDatas,
}: NFTClaimButtonProps) => {
  const wallet = useWallet()
  const { config } = useProjectConfig()
  const { connection } = useEnvironmentCtx()
  const paymentMintInfos = usePaymentMints()
  const rentalRateCard = useRentalRateCard()
  const rentalFixedCard = useRentalFixedCard()
  const rentalFixedExpirationCard = useRentalFixedExpirationCard()
  const rentalManualCard = useRentalManualCard()
  const otpKeypair = useOtp()

  const handleClaim = async (tokenData: TokenData) => {
    if (
      wallet.publicKey &&
      (await allowedToRent(
        connection,
        wallet.publicKey,
        config,
        tokenData,
        false,
        tokenDatas ?? []
      ))
    ) {
      console.log(
        tokenData,
        tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber()
      )
      if (!tokenData.timeInvalidator && !tokenData.useInvalidator) {
        rentalManualCard.showModal({ tokenData, otpKeypair })
      } else if (isRateBasedListing(tokenData)) {
        rentalRateCard.showModal({ tokenData, claim: true, otpKeypair })
      } else if (tokenData.timeInvalidator?.parsed?.durationSeconds) {
        rentalFixedCard.showModal({ tokenData, otpKeypair })
      } else {
        rentalFixedExpirationCard.showModal({ tokenData, otpKeypair })
      }
    }
  }

  if (!paymentMintInfos.data || (isPrivateListing(tokenData) && !otpKeypair)) {
    return <></>
  }
  return (
    <ButtonSmall
      disabled={!wallet.publicKey}
      className="my-auto inline-block max-w-[45%] flex-none text-xs"
      onClick={async () => await handleClaim(tokenData)}
    >
      {isRateBasedListing(tokenData) && paymentMintInfos.data ? (
        <>
          {
            getTokenRentalRate(config, paymentMintInfos.data, tokenData)
              ?.displayText
          }{' '}
        </>
      ) : tokenData.claimApprover?.parsed?.paymentMint &&
        paymentMintInfos.data &&
        paymentMintInfos.data[
          tokenData.claimApprover?.parsed?.paymentMint.toString()
        ] ? (
        `Claim ${fmtMintAmount(
          paymentMintInfos.data[
            tokenData?.claimApprover?.parsed?.paymentMint.toString()
          ],
          tokenData.claimApprover?.parsed?.paymentAmount ?? new BN(0)
        )}${getSymbolFromTokenData(tokenData)}`
      ) : (
        'FREE'
      )}
    </ButtonSmall>
  )
}
