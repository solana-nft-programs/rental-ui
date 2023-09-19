import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import { PublicKey } from '@solana/web3.js'
import { tryPublicKey } from '@solana-nft-programs/common'
import { findTimeInvalidatorAddress } from '@solana-nft-programs/token-manager/dist/cjs/programs/timeInvalidator/pda'
import type { TokenManagerState } from '@solana-nft-programs/token-manager/dist/cjs/programs/tokenManager'
import type { TokenFilter } from 'config/config'
import type { Environment } from 'providers/EnvironmentProvider'

export type IndexedData2 = {
  id?: string
  mint?: string
  invalidators?: string[]
}

export async function filterKnownInvalidators2(
  showUnknownInvalidators: boolean,
  indexedTokenManagers: IndexedData2[]
) {
  /////
  const filteredData = showUnknownInvalidators
    ? indexedTokenManagers
    : indexedTokenManagers.filter(
        ({ id, invalidators }) =>
          !invalidators?.some(
            (invalidator) =>
              invalidator !==
              findTimeInvalidatorAddress(
                tryPublicKey(id) ?? PublicKey.default
              ).toString()
          )
      )
  const indexedTokenManagerDatas = Object.fromEntries(
    filteredData.map((data) => [data.id ?? '', data])
  )
  const tokenManagerIds = Object.keys(indexedTokenManagerDatas).reduce(
    (acc, id) => {
      const pubkey = tryPublicKey(id)
      return pubkey ? [...acc, pubkey] : acc
    },
    [] as PublicKey[]
  )
  return { tokenManagerIds, indexedTokenManagerDatas }
}

export const getTokenIndexData2 = async (
  environment: Environment,
  filter: TokenFilter | null,
  state: TokenManagerState
) => {
  const indexer = new ApolloClient({
    uri: environment.index2,
    cache: new InMemoryCache({ resultCaching: false }),
  })
  const tokenManagerResponse = await (filter?.type === 'creators'
    ? indexer.query({
        query: gql`
          query GetTokenManagers(
            $creators: [String!]!
            $tokenManagerState: smallint!
          ) {
            token_manager(
              where: {
                state: { _eq: $tokenManagerState }
                token_manager_mint_token_metadata_creators: {
                  _and: {
                    creator: { _in: $creators }
                    _and: { verified: { _eq: true } }
                  }
                }
              }
            ) {
              id
              mint
              invalidators
            }
          }
        `,
        variables: {
          creators: filter.value,
          tokenManagerState: state,
        },
      })
    : indexer.query({
        query: gql`
          query GetTokenManagers(
            $issuers: [String!]!
            $tokenManagerState: smallint!
          ) {
            token_manager(
              where: {
                state: { _eq: $tokenManagerState }
                issuer: { _in: $issuers }
              }
            ) {
              id
              mint
              invalidators
            }
          }
        `,
        variables: {
          issuers: filter?.value,
          tokenManagerState: state,
        },
      }))
  return tokenManagerResponse.data['token_manager'] as IndexedData2[]
}
