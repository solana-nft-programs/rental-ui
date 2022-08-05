import type { AccountData } from '@cardinal/common'
import type { PublicKey } from '@solana/web3.js'
import { tracer, withTrace } from 'common/trace'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import type { ParsedTokenAccountData } from 'providers/SolanaAccountsProvider'
import { deserializeAccountInfos } from 'providers/SolanaAccountsProvider'
import { useQuery } from 'react-query'

export const useTokenAccountInfo = (tokenAccount: PublicKey | undefined) => {
  const { secondaryConnection } = useEnvironmentCtx()
  return useQuery<AccountData<ParsedTokenAccountData> | undefined>(
    ['useTokenAccountInfo', tokenAccount?.toString()],
    async () =>
      withTrace(async () => {
        if (!tokenAccount) return
        const accountInfo = await secondaryConnection.getParsedAccountInfo(
          tokenAccount
        )
        const deserializedAccount = deserializeAccountInfos(
          [tokenAccount],
          [accountInfo.value]
        )
        return deserializedAccount[tokenAccount.toString()] as
          | AccountData<ParsedTokenAccountData>
          | undefined
      }, tracer({ name: 'useTokenAccountInfo' })),
    {
      enabled: !!tokenAccount,
    }
  )
}
