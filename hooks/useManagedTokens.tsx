import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import type { AccountData } from '@cardinal/common'
import {
  fetchAccountDataById,
  findMintMetadataId,
  tryDecodeIdlAccount,
  tryPublicKey,
} from '@cardinal/common'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { TIME_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { findTimeInvalidatorAddress } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/pda'
import type {
  TOKEN_MANAGER_PROGRAM,
  TokenManagerData,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { TOKEN_MANAGER_IDL } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { getTokenManagers } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import { USE_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import type { Metadata } from '@metaplex-foundation/mpl-token-metadata'
import * as Sentry from '@sentry/browser'
import type { Account } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import type { TokenData } from 'apis/api'
import type { ProjectConfig } from 'config/config'
import { withTrace } from 'monitoring/trace'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useAccounts } from 'providers/SolanaAccountsProvider'

import type { IndexedData } from './indexData'
import { filterKnownInvalidators, indexedDataBody } from './indexData'
import { TOKEN_DATA_KEY } from './useBrowseAvailableTokenDatas'
import { useTokenManagersForConfig } from './useTokenManagersForConfig'
import { useWalletId } from './useWalletId'

export type ManagedTokenData = Pick<
  TokenData,
  | 'tokenManager'
  | 'indexedData'
  | 'claimApprover'
  | 'useInvalidator'
  | 'timeInvalidator'
>

export const useManagedTokens = (configOverride?: ProjectConfig) => {
  const walletId = useWalletId()
  const { config: globalConfig } = useProjectConfig()
  const config = configOverride ?? globalConfig
  const { connection, environment } = useEnvironmentCtx()
  const { getAccountDataById } = useAccounts()
  const tokenManagersForConfig = useTokenManagersForConfig(
    configOverride?.filter
  )
  return useQuery<ManagedTokenData[]>(
    [
      TOKEN_DATA_KEY,
      'useManagedTokens',
      config.name,
      walletId?.toString(),
      tokenManagersForConfig.data?.map((tm) => tm.pubkey.toString()).join(','),
    ],
    async () => {
      if (!walletId) return []
      if (environment.index && !config.indexDisabled) {
        ////////////////////// indexed //////////////////////
        const trace = Sentry.startTransaction({
          name: `[useBrowseAvailableTokenDatas] ${config.name}`,
        })
        const indexer = new ApolloClient({
          uri: environment.index,
          cache: new InMemoryCache({ resultCaching: false }),
        })
        const indexedTokenManagers = await withTrace(
          async () => {
            const filter = config.filter
            if (
              filter?.type === 'issuer' &&
              !config.filter?.value.includes(walletId.toString())
            ) {
              return []
            }
            const tokenManagerResponse = await (filter?.type === 'creators'
              ? indexer.query({
                  query: gql`
                    query GetTokenManagersForIssuer(
                      $issuer: String!
                      $creators: [String!]!
                    ) {
                      cardinal_token_managers(
                        where: {
                          issuer: { _eq: $issuer }
                          mint_address_nfts: {
                            metadatas_metadata_creators: {
                              _and: {
                                creator_address: { _in: $creators }
                                _and: { verified: { _eq: true } }
                              }
                            }
                          }
                        }
                      ) ${indexedDataBody}
                    }
                  `,
                  variables: {
                    issuer: walletId.toBase58(),
                    creators: filter.value,
                  },
                })
              : indexer.query({
                  query: gql`
                    query GetTokenManagersForIssuer($issuer: String!) {
                      cardinal_token_managers(
                        where: { issuer: { _eq: $issuer } }
                      ) ${indexedDataBody}
                    }
                  `,
                  variables: {
                    issuer: walletId.toBase58(),
                  },
                }))
            return tokenManagerResponse.data[
              'cardinal_token_managers'
            ] as IndexedData[]
          },
          trace,
          { op: 'index-lookup' }
        )

        ////
        const { tokenManagerIds, indexedTokenManagerDatas } =
          await filterKnownInvalidators(true, indexedTokenManagers, trace)

        ////
        const tokenManagerDatas = await withTrace(
          async () =>
            (
              await getTokenManagers(connection, tokenManagerIds)
            ).filter((tm): tm is AccountData<TokenManagerData> => !!tm.parsed),
          trace,
          {
            op: 'fetch-recent-token-managers',
          }
        )

        ////
        const mintIds = tokenManagerDatas.map((tm) => tm.parsed.mint)
        const idsToFetch = tokenManagerDatas.reduce(
          (acc, tm) => [
            ...acc,
            tm.parsed.claimApprover,
            ...tm.parsed.invalidators,
          ],
          [...mintIds] as (PublicKey | null)[]
        )

        const accountsById = await withTrace(
          () => getAccountDataById(idsToFetch),
          trace,
          { op: 'fetch-accounts' }
        )

        ////
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
            indexedData:
              indexedTokenManagerDatas[tokenManagerData.pubkey.toString()],
            tokenManager: tokenManagerData,
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

        trace.finish()
        return tokenDatas
      } else if (environment.index2) {
        ////////////////////// index2 //////////////////////
        const indexer = new ApolloClient({
          uri: environment.index2,
          cache: new InMemoryCache({ resultCaching: false }),
        })
        const tokenManagerResponse = await (config.filter?.type === 'creators'
          ? indexer.query({
              query: gql`
                query GetTokenManagersForIssuer(
                  $issuer: String!
                  $creators: [String!]!
                ) {
                  token_manager(
                    where: {
                      issuer: { _eq: $issuer }
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
                  }
                }
              `,
              variables: {
                issuer: walletId.toBase58(),
                creators: config.filter.value,
              },
            })
          : indexer.query({
              query: gql`
                query GetTokenManagersForIssuer($issuer: String!) {
                  token_manager(where: { issuer: { _eq: $issuer } }) {
                    id
                    mint
                  }
                }
              `,
              variables: {
                issuer: walletId.toBase58(),
              },
            }))
        const issuedTokenManagers = tokenManagerResponse.data[
          'token_manager'
        ] as {
          id: string
          mint: string
        }[]

        const tokenManagerIds = issuedTokenManagers
          .map(({ id }) => tryPublicKey(id))
          .filter((v): v is PublicKey => !!v)

        // get token managers
        const tokenManagerAccountInfos = await fetchAccountDataById(
          connection,
          tokenManagerIds
        )
        let tokenManagerDatas: AccountData<TokenManagerData>[] = []
        Object.entries(tokenManagerAccountInfos).forEach(([k, a]) => {
          const tm = tryDecodeIdlAccount<'tokenManager', TOKEN_MANAGER_PROGRAM>(
            a,
            'tokenManager',
            TOKEN_MANAGER_IDL
          )
          if (tm.parsed) {
            tokenManagerDatas.push({ ...tm, pubkey: new PublicKey(k) })
          }
        })

        // filter known invalidators
        tokenManagerDatas = config.showUnknownInvalidators
          ? tokenManagerDatas
          : tokenManagerDatas.filter(
              ({ parsed, pubkey }) =>
                !parsed?.invalidators?.some(
                  (invalidator) =>
                    !invalidator.equals(findTimeInvalidatorAddress(pubkey))
                )
            )

        // fetch related accounts
        const idsToFetch = tokenManagerDatas.reduce(
          (acc, tm) => [
            ...acc,
            tm.parsed.claimApprover,
            ...tm.parsed.invalidators,
            findMintMetadataId(tm.parsed.mint),
          ],
          [] as (PublicKey | null)[]
        )
        const accountsById = await getAccountDataById(idsToFetch)

        // collect
        return tokenManagerDatas.map((tokenManagerData) => {
          const timeInvalidatorId = tokenManagerData.parsed.invalidators.filter(
            (invalidator) =>
              accountsById[invalidator.toString()]?.owner?.toString() ===
              TIME_INVALIDATOR_ADDRESS.toString()
          )[0]
          const mintMetadataId = findMintMetadataId(
            tokenManagerData.parsed.mint
          )
          return {
            tokenManager: tokenManagerData,
            recipientTokenAccount: tokenManagerData.parsed.recipientTokenAccount
              ? (accountsById[
                  tokenManagerData.parsed.recipientTokenAccount.toString()
                ] as AccountData<Account>)
              : undefined,
            metaplexData: accountsById[
              mintMetadataId?.toString()
            ] as AccountData<Metadata>,
            claimApprover: tokenManagerData.parsed.claimApprover?.toString()
              ? (accountsById[
                  tokenManagerData.parsed.claimApprover?.toString()
                ] as AccountData<PaidClaimApproverData>)
              : undefined,
            timeInvalidator: timeInvalidatorId
              ? (accountsById[
                  timeInvalidatorId.toString()
                ] as AccountData<TimeInvalidatorData>)
              : undefined,
          }
        })
      } else {
        ////////////////////// non-indexed //////////////////////
        if (!tokenManagersForConfig.data) return []

        // filter by issuer
        const issuedTokenManagers = tokenManagersForConfig.data.filter(
          (tm) => tm.parsed.issuer.toString() === walletId.toString()
        )

        // filter known invalidators
        const tokenManagerDatas = config.showUnknownInvalidators
          ? issuedTokenManagers
          : issuedTokenManagers.filter(
              ({ parsed, pubkey }) =>
                !parsed.invalidators?.some(
                  (invalidator) =>
                    !invalidator.equals(findTimeInvalidatorAddress(pubkey))
                )
            )

        // fetch related accounts
        const idsToFetch = tokenManagerDatas.reduce(
          (acc, tm) => [
            ...acc,
            tm.parsed.claimApprover,
            ...tm.parsed.invalidators,
            findMintMetadataId(tm.parsed.mint),
          ],
          [] as (PublicKey | null)[]
        )
        const accountsById = await getAccountDataById(idsToFetch)

        // collect
        return tokenManagerDatas.map((tokenManagerData) => {
          const timeInvalidatorId = tokenManagerData.parsed.invalidators.filter(
            (invalidator) =>
              accountsById[invalidator.toString()]?.owner?.toString() ===
              TIME_INVALIDATOR_ADDRESS.toString()
          )[0]
          const mintMetadataId = findMintMetadataId(
            tokenManagerData.parsed.mint
          )
          return {
            tokenManager: tokenManagerData,
            recipientTokenAccount: tokenManagerData.parsed.recipientTokenAccount
              ? (accountsById[
                  tokenManagerData.parsed.recipientTokenAccount.toString()
                ] as AccountData<Account>)
              : undefined,
            metaplexData: accountsById[
              mintMetadataId?.toString()
            ] as AccountData<Metadata>,
            claimApprover: tokenManagerData.parsed.claimApprover?.toString()
              ? (accountsById[
                  tokenManagerData.parsed.claimApprover?.toString()
                ] as AccountData<PaidClaimApproverData>)
              : undefined,
            timeInvalidator: timeInvalidatorId
              ? (accountsById[
                  timeInvalidatorId.toString()
                ] as AccountData<TimeInvalidatorData>)
              : undefined,
          }
        })
      }
    },
    { enabled: !!walletId && tokenManagersForConfig.isFetched }
  )
}
