import { gql } from '@apollo/client'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import {
  getTokenManagers,
  getTokenManagersByState,
  getTokenManagersForIssuer,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import type { PublicKey } from '@solana/web3.js'
import type { TokenData } from 'api/api'
import { convertStringsToPubkeys, getTokenDatas } from 'api/api'
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
      if (
        environment.index &&
        config.filter?.type === 'creators' &&
        !config.indexDisabled
      ) {
        /////
        const step1 = Date.now()
        const tokenManagerResponse = await environment.index.query({
          query: gql`
            query GetTokenManagers($creators: [String!]!) {
              cardinal_token_managers(
                where: {
                  mint_address_nfts: {
                    metadatas_attributes: {
                      first_verified_creator: { _in: $creators }
                    }
                  }
                }
              ) {
                address
                mint
                state
                state_changed_at
              }
            }
          `,
          variables: {
            creators: config.filter.value,
          },
        })

        /////
        const step2 = Date.now()
        console.log('2', step2 - step1, tokenManagerResponse)

        const tokenManagerIds: PublicKey[] = tokenManagerResponse.data[
          'cardinal_token_managers'
        ]
          .map((data: { mint: string; address: string }) =>
            tryPublicKey(data.address)
          )
          .filter((id: PublicKey | null): id is PublicKey => id !== null)

        const tokenManagerDatas = await getTokenManagers(
          connection,
          tokenManagerIds
        )

        ////
        const step3 = Date.now()
        console.log('3', step3 - step2)
        const tokenDatas = await getTokenDatas(
          connection,
          tokenManagerDatas,
          config.filter,
          environment.label
        )

        ////
        const step4 = Date.now()
        console.log('4', step4 - step3)
        return tokenDatas
      } else if (environment.api) {
        const response = await fetch(
          `${environment.api}/tokenManagersByState?cluster=${environment.label}&collection=${config.name}`
        )
        const json = (await response.json()) as { data: TokenData[] }
        return json.data.map((tokenData) => convertStringsToPubkeys(tokenData))
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
    [config.name],
    { name: 'useFilteredTokenManagers', refreshInterval: 12000 }
  )
}
