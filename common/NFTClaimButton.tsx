import { BN } from '@project-serum/anchor'
import type * as splToken from '@solana/spl-token'
import type { PublicKey } from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { allowedToRent } from 'handlers/useHandleClaimRental'
import { useOtp } from 'hooks/useOtp'
import { PAYMENT_MINTS, usePaymentMints } from 'hooks/usePaymentMints'
import { useWalletId } from 'hooks/useWalletId'
import { logConfigTokenDataEvent } from 'monitoring/amplitude'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useRentalFixedCard } from 'rental-components/components/RentalFixedCard'
import { useRentalFixedExpirationCard } from 'rental-components/components/RentalFixedExpirationCard'
import { useRentalManualCard } from 'rental-components/components/RentalManualCard'
import { useRentalRateCard } from 'rental-components/components/RentalRateCard'

import { ButtonSmall } from './ButtonSmall'
import { isPrivateListing, isRateBasedListing } from './tokenDataUtils'
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
        [name: string]: Pick<splToken.MintInfo, 'decimals'>
      }
    | undefined
) => {
  if (!paymentMintInfos || !paymentMint) return 'Unknown mint'
  return `${fmtMintAmount(
    paymentMintInfos[paymentMint.toString()],
    paymentAmount ?? new BN(0)
  )} ${mintSymbol(paymentMint)}`
}

interface NFTClaimButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData
  tokenDatas?: TokenData[]
}

export const NFTClaimButton: React.FC<NFTClaimButtonProps> = ({
  tokenData,
  tokenDatas,
}: NFTClaimButtonProps) => {
  const walletId = useWalletId()
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
      walletId &&
      (await allowedToRent(
        connection,
        walletId,
        config,
        tokenData,
        false,
        tokenDatas ?? []
      ))
    ) {
      let rentalType
      if (!tokenData.timeInvalidator && !tokenData.useInvalidator) {
        rentalManualCard.showModal({ tokenData, otpKeypair })
        rentalType = 'manual'
      } else if (isRateBasedListing(tokenData)) {
        rentalRateCard.showModal({ tokenData, claim: true, otpKeypair })
        rentalType = 'rate'
      } else if (tokenData.timeInvalidator?.parsed?.durationSeconds) {
        rentalFixedCard.showModal({ tokenData, otpKeypair })
        rentalType = 'duration'
      } else {
        rentalType = 'expiration'
        rentalFixedExpirationCard.showModal({ tokenData, otpKeypair })
      }
      logConfigTokenDataEvent('nft: click claim', config, tokenData, {
        rental_type: rentalType,
      })
    }
  }

  if (
    !paymentMintInfos.data ||
    (isPrivateListing(tokenData) &&
      otpKeypair?.publicKey.toString() !==
        tokenData.tokenManager?.parsed.claimApprover?.toString() &&
      tokenData.tokenManager?.parsed.claimApprover?.toString() !==
        walletId?.toString())
  ) {
    return <></>
  }
  return (
    <div className="flex flex-col">
      <ButtonSmall
        disabled={!walletId}
        className="inline-block flex-none px-4 py-2 text-lg"
        onClick={async () => await handleClaim(tokenData)}
      >
        {isRateBasedListing(tokenData) && paymentMintInfos.data ? (
          <>Rent</>
        ) : tokenData.claimApprover?.parsed?.paymentMint &&
          paymentMintInfos.data &&
          paymentMintInfos.data[
            tokenData.claimApprover?.parsed?.paymentMint.toString()
          ] ? (
          'Rent'
        ) : (
          'FREE'
        )}
      </ButtonSmall>
    </div>
  )
}
