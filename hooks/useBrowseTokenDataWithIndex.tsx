import '@sentry/tracing'

import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import type { AccountData } from '@cardinal/common'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { TIME_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { findTimeInvalidatorAddress } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/pda'
import type { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import {
  getTokenManagers,
  getTokenManagersByState,
  getTokenManagersForIssuer,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import { USE_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import { findUseInvalidatorAddress } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator/pda'
import * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import * as Sentry from '@sentry/browser'
import type * as spl from '@solana/spl-token'
import type { AccountInfo, ParsedAccountData, PublicKey } from '@solana/web3.js'
import { accountDataById, getTokenDatas } from 'apis/api'
import { tryPublicKey } from 'apis/utils'
import { elligibleForClaim } from 'common/tokenDataUtils'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useQuery } from 'react-query'

export const TOKEN_DATA_KEY = 'tokenData'

export type BrowseTokenData = {
  tokenAccount?: {
    pubkey: PublicKey
    account: AccountInfo<ParsedAccountData>
  }
  indexedData?: IndexedData
  tokenManager?: AccountData<TokenManagerData>
  metaplexData?: AccountData<metaplex.MetadataData>
  editionData?: AccountData<metaplex.EditionData | metaplex.MasterEditionData>
  metadata?: AccountData<any> | null
  claimApprover?: AccountData<PaidClaimApproverData> | null
  useInvalidator?: AccountData<UseInvalidatorData> | null
  timeInvalidator?: AccountData<TimeInvalidatorData> | null
  recipientTokenAccount?: spl.AccountInfo | null
}

export type IndexedData = {
  mint?: string
  address?: string
  invalidator_address?: { invalidator: string }[]
  mint_address_nfts?: {
    name?: string
    uri?: string
    metadatas_attributes?: {
      trait_type: string
      value: string
    }[]
  }
}

export const useBrowseTokenDataWithIndex = () => {
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  return useQuery<BrowseTokenData[]>(
    [TOKEN_DATA_KEY, 'useBrowseTokenDataWithIndex', config.name],
    async () => {
      if (
        (environment.index && config.filter?.type === 'creators') ||
        (config.filter?.type === 'issuer' && !config.indexDisabled)
      ) {
        const transaction = Sentry.startTransaction({
          name: `[useBrowseTokenDataWithIndex] ${config.name}`,
        })

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
                        metadatas_attributes {
                          trait_type
                          value
                        }
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
                        metadatas_attributes {
                          trait_type
                          value
                        }
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
        ] as IndexedData[]

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
            [[], {}] as [PublicKey[], { [a: string]: IndexedData }]
          )
        /////
        const tokenManagerDatas = (
          await getTokenManagers(connection, tokenManagerIds)
        ).filter((tm) => tm.parsed)

        ////
        const mintIds = tokenManagerDatas.map(
          (tokenManager) => tokenManager.parsed.mint
        )
        const metaplexIds = await Promise.all(
          tokenManagerDatas.map(
            async (tm) =>
              (
                await metaplex.MetadataProgram.findMetadataAccount(
                  tm.parsed.mint
                )
              )[0]
          )
        )
        const editionIds = await Promise.all(
          tokenManagerDatas.map(async (tokenManager) =>
            metaplex.Edition.getPDA(tokenManager.parsed.mint)
          )
        )
        const idsToFetch = tokenManagerDatas.reduce(
          (acc, tm) => [
            ...acc,
            tm.parsed.claimApprover,
            ...tm.parsed.invalidators,
            tm.parsed.recipientTokenAccount,
          ],
          [...editionIds, ...mintIds, ...metaplexIds] as (PublicKey | null)[]
        )
        const accountsById = await accountDataById(connection, idsToFetch)
        // const [accountsById, metadatas] = await Promise.all([
        //   accountDataById(connection, idsToFetch),
        //   Promise.all(
        //     tokenManagerDatas.map(async ({ pubkey, parsed }) => {
        //       try {
        //         const indexedData = indexedTokenManagerDatas[pubkey.toString()]
        //         if (!indexedData?.mint_address_nfts?.uri) return undefined
        //         const json = await fetch(
        //           indexedData?.mint_address_nfts?.uri
        //         ).then((r) => r.json())
        //         return {
        //           pubkey: parsed.mint,
        //           parsed: json,
        //         }
        //       } catch (e) {}
        //     })
        //   ),
        // ])
        // const metadataById = metadatas.reduce(
        //   (acc, md, i) => ({
        //     ...acc,
        //     [tokenManagerDatas[i]!.pubkey.toString()]: md,
        //   }),
        //   {} as {
        //     [tokenManagerId: string]:
        //       | { pubkey: PublicKey; parsed: any }
        //       | undefined
        //       | null
        //   }
        // )

        const tokenDatas = tokenManagerDatas.map((tokenManagerData, i) => {
          const timeInvalidatorId = tokenManagerData.parsed.invalidators.filter(
            (invalidator) =>
              accountsById[invalidator.toString()]?.owner?.toString() ===
              TIME_INVALIDATOR_ADDRESS.toString()
          )[0]
          const useInvalidatorId = tokenManagerData.parsed.invalidators.filter(
            (invalidator) =>
              accountsById[invalidator.toString()]?.owner?.toString() ===
              USE_INVALIDATOR_ADDRESS.toString()
          )[0]
          return {
            mint: accountsById[
              tokenManagerData.parsed.mint.toString()
            ] as spl.MintInfo,
            indexedData:
              indexedTokenManagerDatas[tokenManagerData.pubkey.toString()],
            editionData: accountsById[editionIds[i]!.toString()] as
              | {
                  pubkey: PublicKey
                  parsed: metaplex.EditionData | metaplex.MasterEditionData
                }
              | undefined,
            recipientTokenAccount: tokenManagerData.parsed.recipientTokenAccount
              ? (accountsById[
                  tokenManagerData.parsed.recipientTokenAccount?.toString()
                ] as spl.AccountInfo)
              : undefined,
            metaplexData: accountsById[metaplexIds[i]!.toString()] as
              | AccountData<metaplex.MetadataData>
              | undefined,
            tokenManager: tokenManagerData,
            // metadata: metadataById[tokenManagerData.pubkey.toString()],
            claimApprover: tokenManagerData.parsed.claimApprover?.toString()
              ? (accountsById[
                  tokenManagerData.parsed.claimApprover?.toString()
                ] as AccountData<PaidClaimApproverData>)
              : undefined,
            useInvalidator: useInvalidatorId
              ? (accountsById[
                  useInvalidatorId.toString()
                ] as AccountData<UseInvalidatorData>)
              : undefined,
            timeInvalidator: timeInvalidatorId
              ? (accountsById[
                  timeInvalidatorId.toString()
                ] as AccountData<TimeInvalidatorData>)
              : undefined,
          }
        })
        transaction.finish()
        return tokenDatas.filter((tokenData) => elligibleForClaim(tokenData))
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
        const tokenDatas = await getTokenDatas(
          connection,
          tokenManagerDatas,
          config.filter,
          environment.label
        )
        return tokenDatas
      }
    },
    {
      refetchInterval: 20000,
      refetchOnMount: false,
      enabled: !!config,
    }
  )
}
