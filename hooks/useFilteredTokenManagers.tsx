import { gql } from '@apollo/client'
import {
  getTokenManagers,
  getTokenManagersByState,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import type { PublicKey } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import {
  convertStringsToPubkeys,
  getTokenDatas,
  getTokenDatasV2,
} from 'api/api'
import { tryPublicKey } from 'api/utils'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'

import { useDataHook } from './useDataHook'

export const useFilteredTokenManagers = () => {
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  return useDataHook<TokenData[] | undefined>(
    async () => {
      console.log('Fetching for config', config.name)
      if (environment.index) {
        if (config.filter?.type === 'creators') {
          const step0 = Date.now()
          const filteredNftMetadata = await environment.index.query({
            query: gql`
              query GetNfts(
                $creators: [PublicKey!]!
                $limit: Int!
                $offset: Int!
              ) {
                nfts(creators: $creators, limit: $limit, offset: $offset) {
                  mintAddress
                }
              }
            `,
            variables: {
              creators: config.filter.value,
              offset: 0,
              limit: 10000,
            },
          })

          /////
          const step1 = Date.now()
          console.log('1', step1 - step0, filteredNftMetadata)

          const mintIds = filteredNftMetadata.data['nfts'].map(
            (metadata: { mintAddress: string }) => metadata.mintAddress
          )
          const tokenManagerResponse = await environment.index.query({
            query: gql`
              query GetTokenManagers($mintIds: [String!]!) {
                cardinal_token_managers(where: { mint: { _in: $mintIds } }) {
                  address
                  mint
                  state
                  state_changed_at
                }
              }
            `,
            variables: {
              mintIds: mintIds,
            },
          })

          /////
          const step2 = Date.now()
          console.log('2', step2 - step1, tokenManagerResponse)

          const tokenManagerIds = tokenManagerResponse.data[
            'cardinal_token_managers'
          ]
            .map((data: { mint: string; address: string }) =>
              tryPublicKey(data.address)
            )
            .filter((pk: PublicKey | null) => pk)

          const tokenManagerDatas = await getTokenManagers(
            connection,
            tokenManagerIds
          )

          ////
          const step3 = Date.now()
          console.log('3', step3 - step2)
          console.log(tokenManagerDatas)
          const tokenDatas = await getTokenDatas(
            connection,
            tokenManagerDatas.filter((tm) => tm.parsed)
          )

          ////
          const step4 = Date.now()
          console.log('4', step4 - step3)

          return tokenDatas
        }
        return []
      } else if (environment.api) {
        const response = await fetch(
          `${environment.api}/tokenManagersByState?cluster=${environment.label}&collection=${config.name}`
        )
        const json = (await response.json()) as { data: TokenData[] }
        return json.data.map((tokenData) => convertStringsToPubkeys(tokenData))
      } else {
        const tokenManagerDatas = await getTokenManagersByState(
          connection,
          null
        )
        const tokenDatas = await getTokenDatasV2(
          connection,
          tokenManagerDatas,
          config.filter,
          environment.label
        )
        return tokenDatas
      }
    },
    [config.name],
    { name: 'useFilteredTokenManagers', refreshInterval: 10000 }
  )
}
