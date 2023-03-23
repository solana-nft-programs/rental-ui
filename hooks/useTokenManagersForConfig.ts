import type { AccountData } from '@cardinal/common'
import { fetchAccountDataById, tryDecodeIdlAccount } from '@cardinal/common'
import type {
  TOKEN_MANAGER_PROGRAM,
  TokenManagerData,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { TOKEN_MANAGER_IDL } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { findTokenManagerAddress } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/pda'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import type { TokenFilter } from 'config/config'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

import { TOKEN_DATA_KEY } from './useBrowseAvailableTokenDatas'
import { useMintsForConfig } from './useMintsForConfig'

export const useTokenManagersForConfig = (subFilter?: TokenFilter) => {
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  // const page = 0
  // const pageSize = 10000
  const mintList = useMintsForConfig(subFilter ?? config.filter)
  return useQuery<AccountData<TokenManagerData>[]>(
    [
      TOKEN_DATA_KEY,
      'useTokenManagersForConfig',
      config.name,
      subFilter?.value.join(','),
      mintList.data?.join(','),
    ],
    async () => {
      if (environment.index) return []

      // get token manager ids from mint list
      const mintIds = mintList.data ?? []
      const tokenManagerIds = mintIds.map(({ mint }) =>
        findTokenManagerAddress(new PublicKey(mint))
      )

      // get token managers
      const tokenManagerAccountInfos = await fetchAccountDataById(
        connection,
        tokenManagerIds
      )
      const tokenManagerDatas: AccountData<TokenManagerData>[] = []
      Object.entries(tokenManagerAccountInfos).forEach(([k, a]) => {
        const tm = tryDecodeIdlAccount<'tokenManager', TOKEN_MANAGER_PROGRAM>(
          a,
          'tokenManager',
          TOKEN_MANAGER_IDL
        )
        if (tm.parsed) {
          tokenManagerDatas.push({ ...tm, pubkey: new PublicKey(k) })
        }
      })
      return tokenManagerDatas
    },
    {
      enabled: !!config && mintList.isFetched,
    }
  )
}
