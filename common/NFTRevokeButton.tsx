import { invalidate } from '@cardinal/token-manager'
import { useWallet } from '@solana/wallet-adapter-react'
import { useQueryClient } from '@tanstack/react-query'
import type { TokenData } from 'data/data'
import { TOKEN_DATA_KEY } from 'hooks/useBrowseAvailableTokenDatas'
import { logConfigTokenDataEvent } from 'monitoring/amplitude'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'

import { ButtonSmall } from './ButtonSmall'
import { shouldBeInvalidated } from './tokenDataUtils'
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
  const { configFromToken } = useProjectConfig()

  return (
    <>
      {((wallet.publicKey &&
        tokenData?.tokenManager?.parsed.invalidators
          .map((i) => i.toString())
          .includes(wallet.publicKey?.toString())) ||
        shouldBeInvalidated(tokenData, UTCNow)) && (
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
                  callback: () => {
                    logConfigTokenDataEvent(
                      'nft: click revoke',
                      configFromToken(tokenData),
                      tokenData
                    )
                    queryClient.resetQueries([TOKEN_DATA_KEY])
                  },
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
