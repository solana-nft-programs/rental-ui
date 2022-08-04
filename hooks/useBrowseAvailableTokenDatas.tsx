import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import type { AccountData } from '@cardinal/common'
import { tryPublicKey } from '@cardinal/common'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { TIME_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import {
  getTokenManagers,
  getTokenManagersByState,
  getTokenManagersForIssuer,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import { USE_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import * as Sentry from '@sentry/browser'
import type { Connection, PublicKey } from '@solana/web3.js'
import type { TokenData } from 'apis/api'
import { getTokenDatas } from 'apis/api'
import type { Trace } from 'common/trace'
import { withTrace } from 'common/trace'
import type { ProjectConfig, TokenFilter } from 'config/config'
import type { Environment } from 'providers/EnvironmentProvider'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useAccounts } from 'providers/SolanaAccountsProvider'
import { useQuery } from 'react-query'

export const TOKEN_DATA_KEY = 'tokenData'

export type BrowseAvailableTokenData = Pick<
  TokenData,
  | 'indexedData'
  | 'tokenManager'
  | 'claimApprover'
  | 'useInvalidator'
  | 'timeInvalidator'
>

export const indexedDataBody = `
{
  address
  mint
  invalidator_address {
    invalidator
  }
  time_invalidator_address {
    time_invalidator_address
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
    metadatas_metadata_creators {
      creator_address
      verified
    }
  }
}
`

export type IndexedData = {
  mint?: string
  address?: string
  invalidator_address?: { invalidator: string }[]
  time_invalidator_address?: {
    time_invalidator_address: string
  }
  mint_address_nfts?: {
    name?: string
    uri?: string
    edition_pda?: string
    metadatas_attributes?: {
      metadata_address: string
      trait_type: string
      value: string
    }[]
    metadatas_metadata_creators: {
      creator_address: string
      verified: boolean
    }[]
  }
}

export async function filterKnownInvalidators<
  T extends {
    address?: string
    time_invalidator_address?: {
      time_invalidator_address: string
    }
    invalidator_address?: { invalidator: string }[]
  }
>(showUnknownInvalidators: boolean, indexedTokenManagers: T[], trace?: Trace) {
  /////
  const filterSpan = trace?.startChild({
    op: 'filter-known-invalidators',
  })
  const filteredData = showUnknownInvalidators
    ? indexedTokenManagers
    : indexedTokenManagers.filter(
        (data) =>
          !data.invalidator_address?.some(
            ({ invalidator }) =>
              invalidator !==
              data.time_invalidator_address?.time_invalidator_address
          )
      )
  const indexedTokenManagerDatas = Object.fromEntries(
    filteredData.map((data) => [data.address ?? '', data])
  )
  const tokenManagerIds = Object.keys(indexedTokenManagerDatas).reduce(
    (acc, id) => {
      const pubkey = tryPublicKey(id)
      return pubkey ? [...acc, pubkey] : acc
    },
    [] as PublicKey[]
  )
  filterSpan?.finish()
  return { tokenManagerIds, indexedTokenManagerDatas }
}

export async function collectIndexedData<
  T extends {
    address?: string
  }
>(indexedTokenManagers: T[], trace?: Trace) {
  const collectSpan = trace?.startChild({
    op: 'collect-indexed-data',
  })
  const indexedTokenManagerDatas = Object.fromEntries(
    indexedTokenManagers.map((data) => [data.address ?? '', data])
  )
  const tokenManagerIds = Object.keys(indexedTokenManagerDatas).reduce(
    (acc, id) => {
      const pubkey = tryPublicKey(id)
      return pubkey ? [...acc, pubkey] : acc
    },
    [] as PublicKey[]
  )
  collectSpan?.finish()
  return { tokenManagerIds, indexedTokenManagerDatas }
}

export const getTokenIndexData = async (
  environment: Environment,
  filter: TokenFilter,
  showUnknownInvalidators: boolean,
  state: TokenManagerState,
  disallowedMints: string[],
  trace: Trace
) => {
  const indexSpan = trace.startChild({ op: 'index-lookup' })
  const indexer = new ApolloClient({
    uri: environment.index,
    cache: new InMemoryCache({ resultCaching: false }),
  })
  const tokenManagerResponse =
    filter.type === 'creators'
      ? await indexer.query({
          query: gql`
            query GetTokenManagers(
              $creators: [String!]!
              $tokenManagerState: smallint!
              $disallowedMints: [String!]!
            ) {
              cardinal_token_managers(
                where: {
                  state: { _eq: $tokenManagerState }
                  mint_address_nfts: {
                    metadatas_metadata_creators: {
                      _and: {
                        creator_address: { _in: $creators }
                        position: { _eq: 0 }
                        _and: { verified: { _eq: true } }
                      }
                    }
                  }
                  mint: {_nin: $disallowedMints}
                  ${
                    showUnknownInvalidators
                      ? ''
                      : `time_invalidator_address: {}`
                  }
                }
              ) ${indexedDataBody}
            }
          `,
          variables: {
            creators: filter.value,
            tokenManagerState: state,
            disallowedMints,
          },
        })
      : await indexer.query({
          query: gql`
            query GetTokenManagers(
              $issuers: [String!]!
              $tokenManagerState: smallint!
              $disallowedMints: [String!]!
            ) {
              cardinal_token_managers(
                where: {
                  state: { _eq: $tokenManagerState }
                  issuer: { _in: $issuers }
                  mint: {_nin: $disallowedMints}
                  ${
                    showUnknownInvalidators
                      ? ''
                      : `time_invalidator_address: {}`
                  }
                }
              ) ${indexedDataBody}
            }
          `,
          variables: {
            issuers: filter.value,
            tokenManagerState: state,
            disallowedMints,
          },
        })
  /////
  indexSpan.finish()
  return tokenManagerResponse.data['cardinal_token_managers'] as IndexedData[]
}

export const useBrowseAvailableTokenDatas = (
  disabled: boolean,
  disableRefetch: boolean
) => {
  const state = TokenManagerState.Issued
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  const { getAccountDataById } = useAccounts()
  return useQuery<BrowseAvailableTokenData[]>(
    [TOKEN_DATA_KEY, 'useBrowseAvailableTokenDatas', config.name],
    async () => {
      if (
        (environment.index && config.filter?.type === 'creators') ||
        (config.filter?.type === 'issuer' && !config.indexDisabled)
      ) {
        const trace = Sentry.startTransaction({
          name: `[useBrowseAvailableTokenDatas] ${config.name}`,
        })

        ////
        const indexedTokenManagers = await getTokenIndexData(
          environment,
          config.filter,
          config.showUnknownInvalidators ?? false,
          state,
          config.disallowedMints ?? [],
          trace
        )

        /////
        const { tokenManagerIds, indexedTokenManagerDatas } =
          await filterKnownInvalidators(
            config.showUnknownInvalidators ?? false,
            indexedTokenManagers,
            trace
          )

        /////
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
        const idsToFetch = tokenManagerDatas.reduce(
          (acc, tm) => [
            ...acc,
            tm.parsed.claimApprover,
            ...tm.parsed.invalidators,
          ],
          [] as (PublicKey | null)[]
        )

        const accountsById = await withTrace(
          () => getAccountDataById(idsToFetch),
          trace,
          { op: 'fetch-accounts' }
        )

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
        const trace = Sentry.startTransaction({
          name: `[useBrowseAvailableTokenDatas-non-indexed] ${config.name}`,
        })
        const tokenManagerDatas = await withTrace(
          () => getTokenManagersWithoutIndex(connection, config, state),
          trace,
          { op: 'getTokenManagersWithoutIndex' }
        )
        const tokenDatas = await withTrace(
          () =>
            getTokenDatas(
              connection,
              tokenManagerDatas,
              config.filter,
              environment.label
            ),
          trace,
          { op: 'getTokenDatas' }
        )
        return tokenDatas
      }
    },
    {
      refetchInterval: !disableRefetch ? 30000 : undefined,
      refetchOnMount: false,
      enabled: !!config && !disabled,
    }
  )
}

export const getTokenManagersWithoutIndex = async (
  connection: Connection,
  config: ProjectConfig,
  state: TokenManagerState
) => {
  let tokenManagerDatas = []
  if (config.filter?.type === 'issuer') {
    // TODO unsafe loop of network calls
    const tokenManagerDatasByIssuer = await Promise.all(
      config.filter.value.map((issuerString) =>
        tryPublicKey(issuerString)
          ? getTokenManagersForIssuer(connection, tryPublicKey(issuerString)!)
          : []
      )
    )
    tokenManagerDatas = tokenManagerDatasByIssuer
      .flat()
      .filter((tokenManager) => tokenManager.parsed.state === state)
  } else {
    tokenManagerDatas = await getTokenManagersByState(connection, state)
  }
  return tokenManagerDatas
}
