import type { AccountData } from '@cardinal/common'
import { findMintMetadataId } from '@cardinal/common'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { TIME_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { findTimeInvalidatorAddress } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/pda'
import type { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { getTokenManagers } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import { USE_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import type { Metadata } from '@metaplex-foundation/mpl-token-metadata'
import * as Sentry from '@sentry/browser'
import type { Account } from '@solana/spl-token'
import type { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import type { TokenFilter } from 'config/config'
import type { TokenData } from 'data/data'
import { withTrace } from 'monitoring/trace'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useAccounts } from 'providers/SolanaAccountsProvider'

import { filterKnownInvalidators, getTokenIndexData } from './indexData'
import { filterKnownInvalidators2, getTokenIndexData2 } from './indexData2'
import {
  filterPaymentMints,
  TOKEN_DATA_KEY,
} from './useBrowseAvailableTokenDatas'
import { useTokenManagersForConfig } from './useTokenManagersForConfig'

export type BrowseClaimedTokenData = Pick<
  TokenData,
  | 'indexedData'
  | 'tokenManager'
  | 'claimApprover'
  | 'useInvalidator'
  | 'timeInvalidator'
  | 'recipientTokenAccount'
>

export const useBrowseClaimedTokenDatas = (
  disabled: boolean,
  subFilter?: TokenFilter
) => {
  const state = TokenManagerState.Claimed
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  const { getAccountDataById } = useAccounts()
  const tokenManagersForConfig = useTokenManagersForConfig(subFilter)
  return useQuery<BrowseClaimedTokenData[]>(
    [
      TOKEN_DATA_KEY,
      'useBrowseClaimedTokenDatas',
      config.name,
      subFilter,
      tokenManagersForConfig.data?.map((tm) => tm.pubkey.toString()).join(','),
    ],
    async () => {
      if (environment.index && !config.indexDisabled) {
        ////////////////////// indexed //////////////////////
        const trace = Sentry.startTransaction({
          name: `[useBrowseClaimedTokenDatas] ${config.name}`,
        })

        ////
        const indexedTokenManagers = await getTokenIndexData(
          environment,
          subFilter ?? config.filter ?? null,
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
        const idsToFetch = tokenManagerDatas.reduce(
          (acc, tm) => [
            ...acc,
            tm.parsed.claimApprover,
            ...tm.parsed.invalidators,
            tm.parsed.recipientTokenAccount,
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
            recipientTokenAccount:
              tokenManagerData.parsed.recipientTokenAccount &&
              accountsById[
                tokenManagerData.parsed.recipientTokenAccount.toString()
              ]?.parsed
                ? (accountsById[
                    tokenManagerData.parsed.recipientTokenAccount?.toString()
                  ] as AccountData<Account>)
                : undefined,
          }
        })
        trace.finish()
        return tokenDatas
      } else if (environment.index2) {
        // filter by state
        const indexedTokenManagers = await getTokenIndexData2(
          environment,
          subFilter ?? config.filter ?? null,
          state
        )

        // filter known invalidators
        const { tokenManagerIds } = await filterKnownInvalidators2(
          config.showUnknownInvalidators ?? false,
          indexedTokenManagers
        )

        // get data
        const tokenManagerDatas = (
          await getTokenManagers(connection, tokenManagerIds)
        ).filter((tm): tm is AccountData<TokenManagerData> => !!tm.parsed)

        // fetch related accounts
        const idsToFetch = tokenManagerDatas.reduce(
          (acc, tm) => [
            ...acc,
            tm.parsed.claimApprover,
            ...tm.parsed.invalidators,
            findMintMetadataId(tm.parsed.mint),
            tm.parsed.recipientTokenAccount,
          ],
          [] as (PublicKey | null)[]
        )
        const accountsById = await getAccountDataById(idsToFetch)

        let tokenDatas = tokenManagerDatas.map((tokenManagerData) => {
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
            claimApprover: tokenManagerData.parsed.claimApprover?.toString()
              ? (accountsById[
                  tokenManagerData.parsed.claimApprover?.toString()
                ] as AccountData<PaidClaimApproverData>)
              : undefined,
            metaplexData: accountsById[
              mintMetadataId?.toString()
            ] as AccountData<Metadata>,
            timeInvalidator: timeInvalidatorId
              ? (accountsById[
                  timeInvalidatorId.toString()
                ] as AccountData<TimeInvalidatorData>)
              : undefined,
            recipientTokenAccount:
              tokenManagerData.parsed.recipientTokenAccount &&
              accountsById[
                tokenManagerData.parsed.recipientTokenAccount.toString()
              ]?.parsed
                ? (accountsById[
                    tokenManagerData.parsed.recipientTokenAccount?.toString()
                  ] as AccountData<Account>)
                : undefined,
          }
        })

        // filter payment mints
        if (config.type === 'Collection') {
          tokenDatas = filterPaymentMints(tokenDatas, config)
        }
        return tokenDatas
      } else {
        ////////////////////// non-indexed //////////////////////
        if (!tokenManagersForConfig.data) return []

        // filter by state
        const issuedTokenManagers = tokenManagersForConfig.data.filter(
          (tm) => tm.parsed.state === TokenManagerState.Claimed
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
            tm.parsed.recipientTokenAccount,
          ],
          [] as (PublicKey | null)[]
        )
        const accountsById = await getAccountDataById(idsToFetch)

        let tokenDatas = tokenManagerDatas.map((tokenManagerData) => {
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
            claimApprover: tokenManagerData.parsed.claimApprover?.toString()
              ? (accountsById[
                  tokenManagerData.parsed.claimApprover?.toString()
                ] as AccountData<PaidClaimApproverData>)
              : undefined,
            metaplexData: accountsById[
              mintMetadataId?.toString()
            ] as AccountData<Metadata>,
            timeInvalidator: timeInvalidatorId
              ? (accountsById[
                  timeInvalidatorId.toString()
                ] as AccountData<TimeInvalidatorData>)
              : undefined,
            recipientTokenAccount:
              tokenManagerData.parsed.recipientTokenAccount &&
              accountsById[
                tokenManagerData.parsed.recipientTokenAccount.toString()
              ]?.parsed
                ? (accountsById[
                    tokenManagerData.parsed.recipientTokenAccount?.toString()
                  ] as AccountData<Account>)
                : undefined,
          }
        })

        // filter payment mints
        if (config.type === 'Collection') {
          tokenDatas = filterPaymentMints(tokenDatas, config)
        }
        return tokenDatas
      }
    },
    {
      enabled: !!config && !disabled && tokenManagersForConfig.isFetched,
    }
  )
}
