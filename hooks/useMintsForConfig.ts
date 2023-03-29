import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import { useQuery } from '@tanstack/react-query'
import type { TokenFilter } from 'config/config'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'

export const useMintsForConfig = (filter: TokenFilter | undefined) => {
  const { environment } = useEnvironmentCtx()
  return useQuery(
    ['useMintsForConfig', environment.index2, filter?.value.join(',')],
    async () => {
      if (!environment.index2) return []
      const indexer = new ApolloClient({
        uri: environment.index2,
        cache: new InMemoryCache({ resultCaching: true }),
      })
      const result = await indexer.query({
        query: gql`
          query MintList($creators: [String!]!) {
            token_metadata_creators(
              where: {
                _and: { creator: { _in: $creators }, verified: { _eq: true } }
              }
            ) {
              mint
            }
          }
        `,
        variables: {
          creators: filter?.value ?? [],
        },
      })
      return result.data['token_metadata_creators'] as { mint: string }[]
    }
  )
}
