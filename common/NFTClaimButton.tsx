import { BN } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import type { TokenData } from 'api/api'
import { getSymbolFromTokenData, getTokenRentalRate } from 'components/Browse'
import { allowedToRent } from 'handlers/useHandleClaimRental'
import { useOtp } from 'hooks/useOtp'
import { usePaymentMints } from 'hooks/usePaymentMints'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useRentalFixedCard } from 'rental-components/components/RentalFixedCard'
import { useRentalRateCard } from 'rental-components/components/RentalRateCard'

import { ButtonSmall } from './ButtonSmall'
import { fmtMintAmount } from './units'

interface NFTClaimButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData
  tokenDatas?: TokenData[]
  callback?: () => void
}

export const NFTClaimButton: React.FC<NFTClaimButtonProps> = ({
  tokenData,
  tokenDatas,
  callback,
}: NFTClaimButtonProps) => {
  const wallet = useWallet()
  const { config } = useProjectConfig()
  const { connection } = useEnvironmentCtx()
  const paymentMintInfos = usePaymentMints()
  const rentalRateCard = useRentalRateCard()
  const rentalFixedCard = useRentalFixedCard()
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
      if (tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber() === 0) {
        rentalRateCard.showModal({ tokenData, claim: true, otpKeypair })
      } else {
        rentalFixedCard.showModal({ tokenData, otpKeypair })
      }
    }
  }

  return (
    <ButtonSmall
      disabled={!wallet.publicKey}
      className="my-auto inline-block max-w-[45%] flex-none text-xs"
      onClick={async () => await handleClaim(tokenData)}
    >
      {tokenData.timeInvalidator?.parsed.durationSeconds?.toNumber() === 0 &&
      paymentMintInfos.data ? (
        <>
          {
            getTokenRentalRate(config, paymentMintInfos.data, tokenData)
              ?.displayText
          }{' '}
        </>
      ) : (
        <>
          {tokenData.claimApprover?.parsed?.paymentMint &&
          paymentMintInfos.data &&
          paymentMintInfos.data[
            tokenData.claimApprover?.parsed?.paymentMint.toString()
          ]
            ? `Claim ${parseFloat(
                fmtMintAmount(
                  paymentMintInfos.data[
                    tokenData?.claimApprover?.parsed?.paymentMint.toString()
                  ],
                  tokenData.claimApprover?.parsed?.paymentAmount ?? new BN(0)
                )
              )}${getSymbolFromTokenData(tokenData)}`
            : 'FREE'}
        </>
      )}
    </ButtonSmall>
  )
}
