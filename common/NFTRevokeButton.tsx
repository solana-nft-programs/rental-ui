import { invalidate } from '@cardinal/token-manager'
import { shouldTimeInvalidate } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/utils'
import { useWallet } from '@solana/wallet-adapter-react'
import type { TokenData } from 'api/api'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useUTCNow } from 'providers/UTCNowProvider'

import { ButtonSmall } from './ButtonSmall'
import { executeTransaction } from './Transactions'
import { asWallet } from './Wallets'

interface NFTRevokeButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData
  callback?: () => void
}

export const NFTRevokeButton: React.FC<NFTRevokeButtonProps> = ({
  tokenData,
  callback,
}: NFTRevokeButtonProps) => {
  const wallet = useWallet()
  const { connection } = useEnvironmentCtx()
  const { UTCNow } = useUTCNow()

  return (
    <>
      {((wallet.publicKey &&
        tokenData?.tokenManager?.parsed.invalidators &&
        tokenData?.tokenManager?.parsed.invalidators
          .map((i) => i.toString())
          .includes(wallet.publicKey?.toString())) ||
        (tokenData.timeInvalidator &&
          tokenData.tokenManager &&
          shouldTimeInvalidate(
            tokenData.tokenManager,
            tokenData.timeInvalidator,
            UTCNow
          )) ||
        (tokenData.useInvalidator &&
          tokenData.useInvalidator.parsed.maxUsages &&
          tokenData.useInvalidator.parsed.usages.gte(
            tokenData.useInvalidator.parsed.maxUsages
          ))) && (
        <ButtonSmall
          disabled={!wallet.connected}
          onClick={async () => {
            tokenData?.tokenManager &&
              executeTransaction(
                connection,
                asWallet(wallet),
                await invalidate(
                  connection,
                  asWallet(wallet),
                  tokenData?.tokenManager?.parsed.mint
                ),
                {
                  callback,
                  silent: true,
                }
              )
          }}
        >
          Revoke
        </ButtonSmall>
      )}
    </>
  )
}
