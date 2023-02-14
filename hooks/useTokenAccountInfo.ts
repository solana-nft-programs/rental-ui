import type { AccountData } from '@cardinal/common'
import { Account } from '@solana/spl-token'
import type { PublicKey } from '@solana/web3.js'
import { tracer, withTrace } from 'monitoring/trace'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { deserializeAccountInfos } from 'providers/SolanaAccountsProvider'
import { useQuery } from 'react-query'

export const useTokenAccountInfo = (tokenAccount: PublicKey | undefined) => {
  const { secondaryConnection } = useEnvironmentCtx()
  return useQuery<AccountData<Account> | undefined>(
    ['useTokenAccountInfo', tokenAccount?.toString()],
    async () =>
      withTrace(async () => {
        if (!tokenAccount) return
        const accountInfo = await secondaryConnection.getAccountInfo(
          tokenAccount
        )
        const deserializedAccount = deserializeAccountInfos(
          [tokenAccount],
          [accountInfo]
        )
        return deserializedAccount[tokenAccount.toString()] as
          | AccountData<Account>
          | undefined
      }, tracer({ name: 'useTokenAccountInfo' })),
    {
      enabled: !!tokenAccount,
    }
  )
}
