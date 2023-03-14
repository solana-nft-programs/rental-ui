import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import { useQuery } from '@tanstack/react-query'
import type { TokenFilter } from 'config/config'

export const useMintList = (filter: TokenFilter | undefined) => {
  return useQuery(
    ['useMintList', filter?.value.join(',')],
    async () => {
      const indexer = new ApolloClient({
        uri: 'https://welcome-elk-85.hasura.app/v1/graphql',
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
    },
    {
      enabled: !!filter,
    }
  )
}
