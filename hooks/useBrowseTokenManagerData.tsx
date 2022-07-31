import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import type { AccountData } from '@cardinal/common'
import { findTimeInvalidatorAddress } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/pda'
import type { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import {
  getTokenManagers,
  getTokenManagersByState,
  getTokenManagersForIssuer,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import { findUseInvalidatorAddress } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator/pda'
import type { PublicKey } from '@solana/web3.js'
import { tryPublicKey } from 'apis/utils'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useQuery } from 'react-query'

import { TOKEN_DATA_KEY } from './useBrowseTokenData'

export type BrowseTokenManagerData = {
  tokenManager: AccountData<TokenManagerData>
  indexedTokenData?: IndexedTokenData
}

export type IndexedTokenData = {
  mint?: string
  address?: string
  invalidator_address?: { invalidator: string }[]
  mint_address_nfts?: {
    name?: string
    uri?: string
  }
}

export const useBrowseTokenManagerData = () => {
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  return useQuery<BrowseTokenManagerData[]>(
    [TOKEN_DATA_KEY, 'useBrowseTokenManagerData', config.name],
    async () => {
      if (
        (environment.index && config.filter?.type === 'creators') ||
        (config.filter?.type === 'issuer' && !config.indexDisabled)
      ) {
        /////
        const indexer = new ApolloClient({
          uri: environment.index,
          cache: new InMemoryCache({ resultCaching: false }),
        })

        const tokenManagerResponse =
          config.filter.type === 'creators'
            ? await indexer.query({
                query: gql`
                  query GetTokenManagers($creators: [String!]!) {
                    cardinal_token_managers(
                      where: {
                        mint_address_nfts: {
                          metadatas_metadata_creators: {
                            _and: {
                              creator_address: { _in: $creators }
                              position: { _eq: 0 }
                              _and: { verified: { _eq: true } }
                            }
                          }
                        }
                      }
                    ) {
                      address
                      mint
                      state
                      state_changed_at
                      invalidator_address {
                        invalidator
                      }
                      mint_address_nfts {
                        uri
                        name
                      }
                    }
                  }
                `,
                variables: {
                  creators: config.filter.value,
                },
              })
            : await indexer.query({
                query: gql`
                  query GetTokenManagers($issuers: [String!]!) {
                    cardinal_token_managers(
                      where: { issuer: { _in: $issuers } }
                    ) {
                      address
                      mint
                      state
                      state_changed_at
                      invalidator_address {
                        invalidator
                      }
                      mint_address_nfts {
                        uri
                        name
                      }
                    }
                  }
                `,
                variables: {
                  issuers: config.filter.value,
                },
              })
        /////
        const indexedTokenManagers = tokenManagerResponse.data[
          'cardinal_token_managers'
        ] as IndexedTokenData[]

        /////
        const knownInvalidators: string[][] = await Promise.all(
          indexedTokenManagers.map(async ({ address }): Promise<string[]> => {
            const tokenManagerId = tryPublicKey(address)
            if (!tokenManagerId) return []
            const [[timeInvalidatorId], [useInvalidatorId]] = await Promise.all(
              [
                findTimeInvalidatorAddress(tokenManagerId),
                findUseInvalidatorAddress(tokenManagerId),
              ]
            )
            return [timeInvalidatorId.toString(), useInvalidatorId.toString()]
          })
        )
        const [tokenManagerIds, indexedTokenManagerDatas] =
          indexedTokenManagers.reduce(
            (acc, data, i) => {
              const tokenManagerId = tryPublicKey(data.address)
              if (!tokenManagerId) return acc
              let filter = false
              data.invalidator_address?.forEach(({ invalidator }) => {
                if (
                  !config.showUnknownInvalidators &&
                  !knownInvalidators[i]?.includes(invalidator)
                ) {
                  filter = true
                }
              })
              return filter
                ? acc
                : [
                    [...acc[0], tokenManagerId],
                    { ...acc[1], [tokenManagerId.toString()]: data },
                  ]
            },
            [[], {}] as [PublicKey[], { [a: string]: IndexedTokenData }]
          )
        /////
        const tokenManagerDatas = (
          await getTokenManagers(connection, tokenManagerIds)
        ).filter((tm) => tm.parsed)

        return tokenManagerDatas.map((tokenManagerData) => ({
          tokenManager: tokenManagerData,
          indexedTokenData:
            indexedTokenManagerDatas[tokenManagerData.pubkey.toString()],
        }))
      } else {
        let tokenManagerDatas = []
        if (config.filter?.type === 'issuer') {
          // TODO unsafe loop of network calls
          const tokenManagerDatasByIssuer = await Promise.all(
            config.filter.value.map((issuerString) =>
              tryPublicKey(issuerString)
                ? getTokenManagersForIssuer(
                    connection,
                    tryPublicKey(issuerString)!
                  )
                : []
            )
          )
          tokenManagerDatas = tokenManagerDatasByIssuer.flat()
        } else {
          tokenManagerDatas = await getTokenManagersByState(
            connection,
            config.issuedOnly ? TokenManagerState.Issued : null
          )
        }
        return tokenManagerDatas.map((tokenManagerData) => ({
          tokenManager: tokenManagerData,
        }))
      }
    },
    {
      refetchInterval: 10000,
      refetchOnMount: false,
      enabled: !!config,
    }
  )
}
