import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import type { AccountData } from '@cardinal/common'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import type { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { getTokenManagersForIssuer } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import type * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import type * as spl from '@solana/spl-token'
import type { AccountInfo, ParsedAccountData, PublicKey } from '@solana/web3.js'
import type { EditionInfo, TokenData } from 'apis/api'
import { convertStringsToPubkeys, getTokenDatas } from 'apis/api'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useQuery } from 'react-query'

import { useWalletId } from './useWalletId'

const INDEX_ENABLED_MANAGER = false

export type ManagedTokenData = {
  tokenAccount?: {
    pubkey: PublicKey
    account: AccountInfo<ParsedAccountData>
  }
  tokenManager?: AccountData<TokenManagerData>
  metaplexData?: { pubkey: PublicKey; data: metaplex.MetadataData } | null
  editionData?: EditionInfo | null
  metadata?: any
  claimApprover?: AccountData<PaidClaimApproverData> | null
  useInvalidator?: AccountData<UseInvalidatorData> | null
  timeInvalidator?: AccountData<TimeInvalidatorData> | null
  recipientTokenAccount?: spl.AccountInfo | null
}

export const useManagedTokens = () => {
  const walletId = useWalletId()
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  return useQuery<ManagedTokenData[]>(
    ['useManagedTokens', walletId?.toString()],
    async () => {
      if (!walletId) return []
      if (environment.index && INDEX_ENABLED_MANAGER) {
        const indexer = new ApolloClient({
          uri: environment.index,
          cache: new InMemoryCache({ resultCaching: false }),
        })
        const response = await indexer.query({
          query: gql`
            query GetTokenManagersForIssuer(
              $issuer: String!
              $limit: Int!
              $offset: Int!
            ) {
              cardinal_token_managers(
                where: { issuer: { _eq: $issuer } }
                limit: $limit
                offset: $offset
              ) {
                address
                mint
                amount
                state
                state_changed_at
              }
            }
          `,
          variables: {
            issuer: walletId.toBase58(),
            limit: 200,
            offset: 0,
          },
        })
        console.log(response)
        return response.data
      } else if (environment.api) {
        const response = await fetch(
          `${
            environment.api
          }/tokenManagersByIssuer?issuer=${walletId.toBase58()}&cluster=${
            environment.label
          }`
        )
        const json = (await response.json()) as { data: TokenData[] }
        return json.data.map((tokenData) => convertStringsToPubkeys(tokenData))
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
    { enabled: !!walletId, refetchInterval: 10000 }
  )
}
