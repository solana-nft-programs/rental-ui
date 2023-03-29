import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import type { AccountData } from '@cardinal/common'
import {
  fetchAccountDataById,
  tryDecodeIdlAccount,
  tryPublicKey,
} from '@cardinal/common'
import type {
  TOKEN_MANAGER_PROGRAM,
  TokenManagerData,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { TOKEN_MANAGER_IDL } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { findTokenManagerAddress } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/pda'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import type { TokenFilter } from 'config/config'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

import { TOKEN_DATA_KEY } from './useBrowseAvailableTokenDatas'
import { useMintsForConfig } from './useMintsForConfig'

const MAX_MINT_LIST = 5000

export const useTokenManagersForConfig = (subFilter?: TokenFilter) => {
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  const mintList = useMintsForConfig(subFilter ?? config.filter)
  return useQuery<AccountData<TokenManagerData>[]>(
    [
      TOKEN_DATA_KEY,
      'useTokenManagersForConfig',
      config.name,
      subFilter?.value.join(','),
      mintList.data?.join(','),
    ],
    async () => {
      if (environment.index || environment.index2) return []

      // get token manager ids from mint list
      const mintIds = mintList.data ?? []

      let tokenManagerIds = []
      if (mintIds.length > MAX_MINT_LIST && environment.index2) {
        const indexer = new ApolloClient({
          uri: environment.index2,
          cache: new InMemoryCache({ resultCaching: false }),
        })
        const tokenManagerResponse = await (subFilter?.type === 'creators'
          ? indexer.query({
              query: gql`
                query GetTokenManagers($creators: [String!]!) {
                  token_manager(
                    where: {
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
                creators: subFilter.value,
              },
            })
          : indexer.query({
              query: gql`
                query GetTokenManagers($issuer: String!) {
                  token_manager(where: { issuer: { _in: $issuers } }) {
                    id
                    mint
                  }
                }
              `,
              variables: {
                issuers: subFilter?.value,
              },
            }))
        const indexData = tokenManagerResponse.data['token_manager'] as {
          id: string
          mint: string
        }[]
        tokenManagerIds = indexData
          .map(({ id }) => tryPublicKey(id))
          .filter((v): v is PublicKey => !!v)
      } else {
        tokenManagerIds = mintIds.map(({ mint }) =>
          findTokenManagerAddress(new PublicKey(mint))
        )
      }

      // get token managers
      const tokenManagerAccountInfos = await fetchAccountDataById(
        connection,
        tokenManagerIds
      )
      const tokenManagerDatas: AccountData<TokenManagerData>[] = []
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
      return tokenManagerDatas
    },
    {
      enabled: !!config && mintList.isFetched,
    }
  )
}
