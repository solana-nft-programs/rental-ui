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
import type { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import type { ProjectConfig, TokenFilter } from 'config/config'
import type { TokenData } from 'data/data'
import { withTrace } from 'monitoring/trace'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useAccounts } from 'providers/SolanaAccountsProvider'

import { filterKnownInvalidators, getTokenIndexData } from './indexData'
import { filterKnownInvalidators2, getTokenIndexData2 } from './indexData2'
import { WRAPPED_SOL_MINT } from './usePaymentMints'
import { useTokenManagersForConfig } from './useTokenManagersForConfig'

export const TOKEN_DATA_KEY = 'tokenData'

export type BrowseAvailableTokenData = Pick<
  TokenData,
  | 'indexedData'
  | 'tokenManager'
  | 'claimApprover'
  | 'useInvalidator'
  | 'timeInvalidator'
  | 'metaplexData'
>

export function filterPaymentMints<
  T extends Pick<
    TokenData,
    'tokenManager' | 'timeInvalidator' | 'claimApprover'
  >
>(tokens: T[], config: ProjectConfig, paymentMints?: string[]) {
  return tokens.filter((token) => {
    if (
      config.type === 'Collection' &&
      (token.timeInvalidator?.parsed.extensionPaymentMint ||
        token.claimApprover?.parsed?.paymentMint)
    ) {
      if (config.allowNonSol) {
        const allowedMints = paymentMints ??
          config.rentalCard.invalidationOptions?.paymentMints ?? [
            WRAPPED_SOL_MINT,
          ]
        return (
          allowedMints.includes(
            token.timeInvalidator?.parsed.extensionPaymentMint?.toString() ?? ''
          ) ||
          allowedMints.includes(
            token.claimApprover?.parsed.paymentMint.toString() ?? ''
          )
        )
      } else {
        return (
          token.timeInvalidator?.parsed.extensionPaymentMint?.toString() ===
            WRAPPED_SOL_MINT ||
          token.claimApprover?.parsed.paymentMint.toString() ===
            WRAPPED_SOL_MINT
        )
      }
    }
    return true
  })
}

export const useBrowseAvailableTokenDatas = (subFilter?: TokenFilter) => {
  const state = TokenManagerState.Issued
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  const { getAccountDataById } = useAccounts()
  const tokenManagersForConfig = useTokenManagersForConfig(subFilter)
  return useQuery<BrowseAvailableTokenData[]>(
    [
      TOKEN_DATA_KEY,
      'useBrowseAvailableTokenDatas',
      config.name,
      subFilter,
      tokenManagersForConfig.data?.map((tm) => tm.pubkey.toString()).join(','),
    ],
    async () => {
      if (environment.index && !config.indexDisabled) {
        ////////////////////// indexed //////////////////////
        const trace = Sentry.startTransaction({
          name: `[useBrowseAvailableTokenDatas] ${config.name}`,
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

        /////
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
          ],
          [] as (PublicKey | null)[]
        )

        const accountsById = await withTrace(
          () => getAccountDataById(idsToFetch),
          trace,
          { op: 'fetch-accounts' }
        )

        let tokenDatas = tokenManagerDatas.map((tokenManagerData) => {
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
        if (config.type === 'Collection') {
          tokenDatas = filterPaymentMints(tokenDatas, config)
        }
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
          ],
          [] as (PublicKey | null)[]
        )
        const accountsById = await getAccountDataById(idsToFetch)

        // collect
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
          (tm) => tm.parsed.state === TokenManagerState.Issued
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
      enabled: !!config && tokenManagersForConfig.isFetched,
    }
  )
}
