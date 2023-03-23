import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import { useQuery } from '@tanstack/react-query'
import { projectConfigs } from 'config/config'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'

export const queryId = (s: string, historical: boolean) => {
  return `${s.replaceAll('-', '').replaceAll(/[0-9]/g, '')}${
    historical ? 'historical' : ''
  }`
}

export const useGlobalStats = () => {
  const { environment } = useEnvironmentCtx()
  return useQuery<
    { [key: string]: { aggregate: { count: number } } } | undefined
  >(
    ['useProjectStats'],
    async () => {
      const index = new ApolloClient({
        uri: environment.index,
        cache: new InMemoryCache({ resultCaching: false }),
      })
      const aggregateClaimEventsByConfig = await index.query({
        query: gql`
          query GetCardinalClaimEvents {
            ${Object.entries(projectConfigs)
              .filter(([, c]) => !c.hidden)
              .map(([, c]) =>
                c.filter?.type === 'creators'
                  ? `
              ${queryId(
                c.name,
                true
              )}: cardinal_claim_events_aggregate(where: {time_invalidator_address: {_is_null: false}, mint_address_nfts: {metadatas_attributes: {first_verified_creator: {_in: [${c.filter?.value
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
                  : c.filter?.type === 'issuer'
                  ? `
                  ${queryId(
                    c.name,
                    true
                  )}: cardinal_claim_events_aggregate(where: {issuer: {_in: [${c.filter?.value
                      .map((v) => `"${v}"`)
                      .join(',')}]}}) {
                    aggregate {
                      count
                    }
                  }
                  ${queryId(
                    c.name,
                    false
                  )}: cardinal_token_managers_aggregate(where: {state: {_eq: "1"}, issuer: {_in: [${c.filter?.value
                      .map((v) => `"${v}"`)
                      .join(',')}]}}) {
                    aggregate {
                      count
                    }
                  }
                  `
                  : ''
              )
              .join('')}
            ${queryId(
              'global',
              true
            )}: cardinal_claim_events_aggregate(where: {time_invalidator_address: {_is_null: false}}) {
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
    },
    {
      enabled: !!environment.index,
    }
  )
}
