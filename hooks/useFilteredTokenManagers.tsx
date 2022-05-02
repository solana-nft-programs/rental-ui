import { gql } from '@apollo/client'
import { getTokenManagersByState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import type { TokenData } from 'api/api'
import { convertStringsToPubkeys, getTokenDatas } from 'api/api'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { filterTokens, useProjectConfig } from 'providers/ProjectConfigProvider'

import { useDataHook } from './useDataHook'

export const useFilteredTokenManagers = () => {
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  return useDataHook<TokenData[] | undefined>(
    async () => {
      if (environment.index) {
        const response = await environment.index.query({
          query: gql`
            query GetTokenManagers($limit: Int!, $offset: Int!) {
              cardinal_token_managers(limit: $limit, offset: $offset) {
                address
                mint
                amount
                state
                state_changed_at
              }
            }
          `,
          variables: {
            offset: 0,
            limit: 200,
          },
        })
        return response.data
      } else if (environment.api) {
        const response = await fetch(
          `${environment.api}/tokenManagersByState?cluster=${environment.label}&collection=${config.name}`
        )
        const json = (await response.json()) as { data: TokenData[] }
        console.log(json)
        return json.data.map((tokenData) => convertStringsToPubkeys(tokenData))
      } else {
        const tokenManagerDatas = await getTokenManagersByState(
          connection,
          null
        )
        const tokenDatas = await getTokenDatas(connection, tokenManagerDatas)
        return filterTokens(environment.label, config.filters, tokenDatas)
      }
    },
    [config.name],
    { name: 'useFilteredTokenManagers', refreshInterval: 10000 }
  )
}
