import type { AccountData } from '@cardinal/common'
import type { PublicKey } from '@solana/web3.js'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import type { ParsedTokenAccountData } from 'providers/SolanaAccountsProvider'
import { deserializeAccountInfos } from 'providers/SolanaAccountsProvider'
import { useQuery } from 'react-query'

export const useTokenAccountInfo = (tokenAccount: PublicKey | undefined) => {
  const { secondaryConnection } = useEnvironmentCtx()
  return useQuery<AccountData<ParsedTokenAccountData> | undefined>(
    ['useUserPaymentTokenAccount', tokenAccount?.toString()],
    async () => {
      if (!tokenAccount) return
      const accountInfo = await secondaryConnection.getParsedAccountInfo(
        tokenAccount
      )
      const deserializedAccount = deserializeAccountInfos(
        [tokenAccount],
        [accountInfo.value]
      )
      console.log(deserializedAccount)
      return deserializedAccount[tokenAccount.toString()] as
        | AccountData<ParsedTokenAccountData>
        | undefined
    },
    {
      enabled: !!tokenAccount,
    }
  )
}
