import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import { projectConfigs } from 'config/config'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useQuery } from 'react-query'

export const queryId = (s: string, historical: boolean) => {
  return `${s.replace('-', '').replace(/[0-9]/g, '')}${
    historical ? 'historical' : ''
  }`
}

export const useGlobalStats = () => {
  const { environment } = useEnvironmentCtx()
  return useQuery<
    { [key: string]: { aggregate: { count: number } } } | undefined
  >(['useProjectStats', environment.index], async () => {
    const index = new ApolloClient({
      uri: 'https://prod-holaplex.hasura.app/v1/graphql',
      cache: new InMemoryCache({ resultCaching: false }),
    })
    const aggregateClaimEventsByConfig = await index.query({
      query: gql`
          query GetCardinalClaimEvents {
            ${Object.entries(projectConfigs)
              .filter(([, c]) => !c.hidden)
              .map(
                ([, c]) => `
              ${queryId(
                c.name,
                true
              )}: cardinal_claim_events_aggregate(where: {mint_address_nfts: {metadatas_attributes: {first_verified_creator: {_in: [${c.filter?.value
                  .map((v) => `"${v}"`)
                  .join(',')}]}}}}) {
                aggregate {
                  count
                }
              }
              ${queryId(
                c.name,
                false
              )}: cardinal_token_managers_aggregate(where: {state: {_eq: "1"}, mint_address_nfts: {metadatas_attributes: {first_verified_creator: {_in: [${c.filter?.value
                  .map((v) => `"${v}"`)
                  .join(',')}]}}}}) {
                aggregate {
                  count
                }
              }
              `
              )
              .join('')}
            ${queryId('global', true)}: cardinal_claim_events_aggregate {
              aggregate {
                count
              }
            }
            ${queryId(
              'global',
              false
            )}: cardinal_token_managers_aggregate(where: {state: {_eq: "1"}}) {
              aggregate {
                count
              }
            }
          }
        `,
    })
    return aggregateClaimEventsByConfig.data
  })
}
