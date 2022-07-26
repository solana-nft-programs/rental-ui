import { invalidate } from '@cardinal/token-manager'
import { shouldTimeInvalidate } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/utils'
import { useWallet } from '@solana/wallet-adapter-react'
import type { TokenData } from 'api/api'
import { TOKEN_DATA_KEY } from 'hooks/useFilteredTokenManagers'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useUTCNow } from 'providers/UTCNowProvider'
import { useQueryClient } from 'react-query'

import { ButtonSmall } from './ButtonSmall'
import { executeTransaction } from './Transactions'
import { asWallet } from './Wallets'

interface NFTRevokeButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData
}

export const NFTRevokeButton: React.FC<NFTRevokeButtonProps> = ({
  tokenData,
}: NFTRevokeButtonProps) => {
  const wallet = useWallet()
  const { connection } = useEnvironmentCtx()
  const { UTCNow } = useUTCNow()
  const queryClient = useQueryClient()

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
              (await executeTransaction(
                connection,
                asWallet(wallet),
                await invalidate(
                  connection,
                  asWallet(wallet),
                  tokenData?.tokenManager?.parsed.mint
                ),
                {
                  callback: () => queryClient.removeQueries(TOKEN_DATA_KEY),
                }
              ))
          }}
        >
          Revoke
        </ButtonSmall>
      )}
    </>
  )
}
