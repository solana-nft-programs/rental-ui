import type { AccountData } from '@cardinal/common'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { TIME_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import type { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import { USE_INVALIDATOR_ADDRESS } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import type * as spl from '@solana/spl-token'
import type { AccountInfo, ParsedAccountData, PublicKey } from '@solana/web3.js'
import { accountDataById, getTokenDatas } from 'apis/api'
import { elligibleForClaim } from 'common/tokenDataUtils'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useQuery } from 'react-query'

import { useBrowseTokenManagerData } from './useBrowseTokenManagerData'

export const TOKEN_DATA_KEY = 'tokenData'

export type FilteredTokenManagerData = {
  tokenAccount?: {
    pubkey: PublicKey
    account: AccountInfo<ParsedAccountData>
  }
  tokenManager?: AccountData<TokenManagerData>
  metaplexData?: { pubkey: PublicKey; data: metaplex.MetadataData } | null
  editionData?: AccountData<metaplex.EditionData | metaplex.MasterEditionData>
  metadata?: { pubkey: PublicKey; data: any } | null
  claimApprover?: AccountData<PaidClaimApproverData> | null
  useInvalidator?: AccountData<UseInvalidatorData> | null
  timeInvalidator?: AccountData<TimeInvalidatorData> | null
  recipientTokenAccount?: spl.AccountInfo | null
}

export type IndexedTokenData = {
  mint?: string
  address?: string
  invalidator_address?: { invalidator: string }[]
  mint_address_nfts?: {
    name?: string
    uri?: string
  }
}

export const useBrowseTokenData = () => {
  const { config } = useProjectConfig()
  const { connection, environment } = useEnvironmentCtx()
  const browseTokenManagerQuery = useBrowseTokenManagerData()
  return useQuery<FilteredTokenManagerData[]>(
    [
      TOKEN_DATA_KEY,
      'useBrowseTokenData',
      browseTokenManagerQuery.data?.map(
        (tk) =>
          `${tk.tokenManager?.pubkey.toString()}-${tk.tokenManager?.parsed.stateChangedAt.toString()}`
      ),
    ],
    async () => {
      const browseTokenManagerData = browseTokenManagerQuery.data
      if (!browseTokenManagerData) return []
      const tokenManagerDatas = browseTokenManagerData.map(
        ({ tokenManager }) => tokenManager
      )

      if (
        (environment.index && config.filter?.type === 'creators') ||
        (config.filter?.type === 'issuer' && !config.indexDisabled)
      ) {
        ////
        const mintIds = tokenManagerDatas.map(
          (tokenManager) => tokenManager?.parsed.mint
        )
        const metaplexIds = await Promise.all(
          tokenManagerDatas.map(
            async (tokenManager) =>
              (
                await metaplex.MetadataProgram.findMetadataAccount(
                  tokenManager.parsed.mint
                )
              )[0]
          )
        )
        const editionIds = await Promise.all(
          tokenManagerDatas.map(async (tokenManager) =>
            metaplex.Edition.getPDA(tokenManager.parsed.mint)
          )
        )
        const idsToFetch = tokenManagerDatas.reduce(
          (acc, tm) => [
            ...acc,
            tm.parsed.claimApprover,
            ...tm.parsed.invalidators,
            tm.parsed.recipientTokenAccount,
          ],
          [...editionIds, ...mintIds, ...metaplexIds] as (PublicKey | null)[]
        )
        const [accountsById, metadatas] = await Promise.all([
          accountDataById(connection, idsToFetch),
          Promise.all(
            browseTokenManagerData.map(
              async ({ tokenManager, indexedTokenData }) => {
                try {
                  if (!indexedTokenData?.mint_address_nfts?.uri)
                    return undefined
                  const json = await fetch(
                    indexedTokenData?.mint_address_nfts?.uri
                  ).then((r) => r.json())
                  return {
                    pubkey: tokenManager.parsed.mint,
                    data: json,
                  }
                } catch (e) {}
              }
            )
          ),
        ])

        const metadataById = metadatas.reduce(
          (acc, md, i) => ({
            ...acc,
            [tokenManagerDatas[i]!.pubkey.toString()]: md,
          }),
          {} as {
            [tokenManagerId: string]:
              | { pubkey: PublicKey; data: any }
              | undefined
              | null
          }
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
            mint: accountsById[
              tokenManagerData.parsed.mint.toString()
            ] as spl.MintInfo,
            editionData: accountsById[editionIds[i]!.toString()] as
              | {
                  pubkey: PublicKey
                  parsed: metaplex.EditionData | metaplex.MasterEditionData
                }
              | undefined,
            recipientTokenAccount: tokenManagerData.parsed.recipientTokenAccount
              ? (accountsById[
                  tokenManagerData.parsed.recipientTokenAccount?.toString()
                ] as spl.AccountInfo)
              : undefined,
            metaplexData: accountsById[metaplexIds[i]!.toString()] as
              | {
                  pubkey: PublicKey
                  data: metaplex.MetadataData
                }
              | undefined,
            tokenManager: tokenManagerData,
            metadata: metadataById[tokenManagerData.pubkey.toString()],
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
        return tokenDatas.filter((tokenData) => elligibleForClaim(tokenData))
      } else {
        const tokenDatas = await getTokenDatas(
          connection,
          tokenManagerDatas,
          config.filter,
          environment.label
        )
        return tokenDatas
      }
    },
    {
      refetchOnMount: false,
      enabled: !!config,
    }
  )
}
