import { unissueToken } from '@cardinal/token-manager'
import { useWallet } from '@solana/wallet-adapter-react'
import type { TokenData } from 'api/api'
import { executeTransaction } from 'common/Transactions'
import { asWallet } from 'common/Wallets'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useMutation } from 'react-query'

export interface HandleIssueRentalParams {
  tokenData: TokenData
}

export const useHandleUnissueRental = () => {
  const wallet = useWallet()
  const { connection } = useEnvironmentCtx()
  return useMutation(
    async ({ tokenData }: HandleIssueRentalParams): Promise<string> => {
      if (!tokenData.tokenManager) throw new Error('Invalid token manager')
      if (!wallet.publicKey) throw new Error('Wallet not connected')
      return executeTransaction(
        connection,
        asWallet(wallet),
        await unissueToken(
          connection,
          asWallet(wallet),
          tokenData?.tokenManager?.parsed.mint
        ),
        {
          notificationConfig: {},
          silent: true,
        }
      )
    }
  )
}
