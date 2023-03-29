import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import { tryPublicKey } from '@cardinal/common'
import type { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { PublicKey } from '@solana/web3.js'
import type { TokenFilter } from 'config/config'
import type { Trace } from 'monitoring/trace'
import type { Environment } from 'providers/EnvironmentProvider'

export type IndexedData = {
  mint?: string
  address?: string
  invalidator_address?: { invalidator: string }[]
  time_invalidator_address?: {
    time_invalidator_address: string
  }
  mint_address_nfts?: {
    name?: string
    uri?: string
    edition_pda?: string
    metadata_json?: {
      image?: string
    }
    metadatas_attributes?: {
      metadata_address: string
      trait_type: string
      value: string
    }[]
    metadatas_metadata_creators: {
      creator_address: string
      verified: boolean
    }[]
  }
}

export const indexedDataBody = `
{
  address
  mint
  invalidator_address {
    invalidator
  }
  time_invalidator_address {
    time_invalidator_address
  }
  mint_address_nfts {
    uri
    name
    edition_pda
    metadata_json {
      image
    }
    metadatas_attributes {
      metadata_address
      trait_type
      value
    }
    metadatas_metadata_creators {
      creator_address
      verified
    }
  }
}
`

export async function filterKnownInvalidators(
  showUnknownInvalidators: boolean,
  indexedTokenManagers: IndexedData[],
  trace?: Trace
) {
  /////
  const filterSpan = trace?.startChild({
    op: 'filter-known-invwalidators',
  })
  const filteredData = showUnknownInvalidators
    ? indexedTokenManagers
    : indexedTokenManagers.filter(
        (data) =>
          !data.invalidator_address?.some(
            ({ invalidator }) =>
              invalidator !==
              data.time_invalidator_address?.time_invalidator_address
          )
      )
  const indexedTokenManagerDatas = Object.fromEntries(
    filteredData.map((data) => [data.address ?? '', data])
  )
  const tokenManagerIds = Object.keys(indexedTokenManagerDatas).reduce(
    (acc, id) => {
      const pubkey = tryPublicKey(id)
      return pubkey ? [...acc, pubkey] : acc
    },
    [] as PublicKey[]
  )
  filterSpan?.finish()
  return { tokenManagerIds, indexedTokenManagerDatas }
}

export const getTokenIndexData = async (
  environment: Environment,
  filter: TokenFilter | null,
  showUnknownInvalidators: boolean,
  state: TokenManagerState,
  disallowedMints: string[],
  trace?: Trace
) => {
  const indexSpan = trace?.startChild({ op: 'index-lookup' })
  const indexer = new ApolloClient({
    uri: environment.index,
    cache: new InMemoryCache({ resultCaching: false }),
  })
  const tokenManagerResponse =
    filter?.type === 'creators'
      ? await indexer.query({
          query: gql`
            query GetTokenManagers(
              $creators: [String!]!
              $tokenManagerState: smallint!
              $disallowedMints: [String!]!
            ) {
              cardinal_token_managers(
                where: {
                  state: { _eq: $tokenManagerState }
                  mint_address_nfts: {
                    metadatas_metadata_creators: {
                      _and: {
                        creator_address: { _in: $creators }
                        _and: { verified: { _eq: ${
                          filter.nonVerified ? false : true
                        } } }
                      }
                    }
                  }
                  mint: {_nin: $disallowedMints}
                  ${
                    showUnknownInvalidators
                      ? ''
                      : `time_invalidator_address: {}`
                  }
                }
              ) ${indexedDataBody}
            }
          `,
          variables: {
            creators: filter.value,
            tokenManagerState: state,
            disallowedMints,
          },
        })
      : await indexer.query({
          query: gql`
            query GetTokenManagers(
              $issuers: [String!]!
              $tokenManagerState: smallint!
              $disallowedMints: [String!]!
            ) {
              cardinal_token_managers(
                where: {
                  state: { _eq: $tokenManagerState }
                  issuer: { _in: $issuers }
                  mint: {_nin: $disallowedMints}
                  ${
                    showUnknownInvalidators
                      ? ''
                      : `time_invalidator_address: {}`
                  }
                }
              ) ${indexedDataBody}
            }
          `,
          variables: {
            issuers: filter?.value ?? [],
            tokenManagerState: state,
            disallowedMints,
          },
        })
  /////
  indexSpan?.finish()
  return tokenManagerResponse.data['cardinal_token_managers'] as IndexedData[]
}
