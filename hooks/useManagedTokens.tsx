import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import type { AccountData } from '@cardinal/common'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { TIME_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import type { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import {
  getTokenManagers,
  getTokenManagersForIssuer,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import { USE_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import * as Sentry from '@sentry/browser'
import type { PublicKey } from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { getTokenDatas } from 'apis/api'
import { withTrace } from 'monitoring/trace'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useAccounts } from 'providers/SolanaAccountsProvider'
import { useQuery } from 'react-query'

import type { IndexedData } from './useBrowseAvailableTokenDatas'
import {
  filterKnownInvalidators,
  indexedDataBody,
  TOKEN_DATA_KEY,
} from './useBrowseAvailableTokenDatas'
import { useWalletId } from './useWalletId'

const INDEX_ENABLED_MANAGE = true

export type ManagedTokenData = Pick<
  TokenData,
  | 'tokenManager'
  | 'indexedData'
  | 'claimApprover'
  | 'useInvalidator'
  | 'timeInvalidator'
  | 'recipientTokenAccount'
>

export const useManagedTokens = () => {
  const walletId = useWalletId()
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  const { getAccountDataById } = useAccounts()
  return useQuery<ManagedTokenData[]>(
    [TOKEN_DATA_KEY, 'useManagedTokens', walletId?.toString()],
    async () => {
      if (!walletId) return []
      if (environment.index && INDEX_ENABLED_MANAGE && !config.indexDisabled) {
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
    { enabled: !!walletId, refetchInterval: 40000 }
  )
}
