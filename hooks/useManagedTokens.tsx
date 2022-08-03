import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import {
  getTokenManagers,
  getTokenManagersForIssuer,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import * as Sentry from '@sentry/browser'
import type { TokenData } from 'apis/api'
import { getTokenDatas } from 'apis/api'
import { withTrace } from 'common/trace'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useQuery } from 'react-query'

import type { IndexedData } from './useBrowseAvailableTokenDatas'
import {
  filterKnownInvalidators,
  TOKEN_DATA_KEY,
} from './useBrowseAvailableTokenDatas'
import { useWalletId } from './useWalletId'

const INDEX_ENABLED_MANAGE = true

export type ManagedTokenData = Pick<
  TokenData,
  | 'tokenAccount'
  | 'mint'
  | 'tokenManager'
  | 'metaplexData'
  | 'metadata'
  | 'editionData'
  | 'claimApprover'
  | 'useInvalidator'
  | 'timeInvalidator'
  | 'recipientTokenAccount'
>

export const useManagedTokens = () => {
  const walletId = useWalletId()
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
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
        const tokenManagerResponse = await withTrace(
          () =>
            indexer.query({
              query: gql`
                query GetTokenManagersForIssuer($issuer: String!) {
                  cardinal_token_managers(where: { issuer: { _eq: $issuer } }) {
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
                      edition_pda
                      metadatas_attributes {
                        metadata_address
                        trait_type
                        value
                      }
                    }
                  }
                }
              `,
              variables: {
                issuer: walletId.toBase58(),
              },
            }),
          trace,
          { op: 'index-lookup' }
        )
        const indexedTokenManagers = tokenManagerResponse.data[
          'cardinal_token_managers'
        ] as IndexedData[]

        const { tokenManagerIds } = await filterKnownInvalidators(
          config,
          indexedTokenManagers,
          trace
        )

        const tokenManagerDatas = await withTrace(
          async () =>
            (
              await getTokenManagers(connection, tokenManagerIds)
            ).filter((tm) => tm.parsed),
          trace,
          {
            op: 'fetch-recent-token-managers',
          }
        )

        ////
        const tokenDatas = await getTokenDatas(
          connection,
          tokenManagerDatas,
          config.filter,
          environment.label
        )
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
