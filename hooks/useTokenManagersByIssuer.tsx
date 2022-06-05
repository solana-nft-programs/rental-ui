import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import { getTokenManagersForIssuer } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import type { TokenData } from 'api/api'
import { convertStringsToPubkeys, getTokenDatas } from 'api/api'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useQuery } from 'react-query'

import { useWalletId } from './useWalletId'

const INDEX_ENABLED_MANAGER = false

export const useTokenManagersByIssuer = () => {
  const walletId = useWalletId()
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  return useQuery<TokenData[] | undefined>(
    ['useTokenManagersByIssuer', walletId?.toString()],
    async () => {
      if (!walletId) return
      if (environment.index && INDEX_ENABLED_MANAGER) {
        const indexer = new ApolloClient({
          uri: environment.index,
          cache: new InMemoryCache({ resultCaching: false }),
        })
        const response = await indexer.query({
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
        )
        const json = (await response.json()) as { data: TokenData[] }
        return json.data.map((tokenData) => convertStringsToPubkeys(tokenData))
      } else {
        const tokenManagerDatas = await getTokenManagersForIssuer(
          connection,
          walletId
        )
        const tokenDatas = await getTokenDatas(
          connection,
          tokenManagerDatas,
          config.filter,
          environment.label
        )
        return tokenDatas
      }
    },
    { refetchInterval: 10000 }
  )
}
