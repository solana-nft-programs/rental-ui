import { gql } from '@apollo/client'
import { getTokenManagersForIssuer } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import type { TokenData } from 'api/api'
import { convertStringsToPubkeys, getTokenDatasV2 } from 'api/api'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

// import { filterTokens, useProjectConfig } from 'providers/ProjectConfigProvider'
import { useDataHook } from './useDataHook'
import { useWalletId } from './useWalletId'

export const useTokenManagersByIssuer = () => {
  const walletId = useWalletId()
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  return useDataHook<TokenData[] | undefined>(
    async () => {
      if (!walletId) return
      if (environment.index) {
        const response = await environment.index.query({
          query: gql`
            query GetTokenManagersForIssuer(
              $issuer: String!
              $limit: Int!
              $offset: Int!
            ) {
              cardinal_token_managers(
                where: { issuer: { _eq: $issuer } }
                limit: $limit
                offset: $offset
              ) {
                address
                mint
                amount
                state
                state_changed_at
              }
            }
          `,
          variables: {
            issuer: walletId.toBase58(),
            limit: 200,
            offset: 0,
          },
        })
        console.log(response)
        return response.data
      } else if (environment.api) {
        const response = await fetch(
          `${
            environment.api
          }/tokenManagersByIssuer?issuer=${walletId.toBase58()}&cluster=${
            environment.label
          }`
          // &collection=${config.name}
        )
        const json = (await response.json()) as { data: TokenData[] }
        return json.data.map((tokenData) => convertStringsToPubkeys(tokenData))
      } else {
        const tokenManagerDatas = await getTokenManagersForIssuer(
          connection,
          walletId
        )
        const tokenDatas = await getTokenDatasV2(
          connection,
          tokenManagerDatas,
          config.filter,
          environment.label
        )
        return tokenDatas
      }
    },
    [walletId?.toString()],
    { name: 'useTokenManagersByIssuer' }
  )
}
