import type { AccountData } from '@cardinal/common'
import {
  getBatchedMultipleAccounts,
  METADATA_PROGRAM_ID,
} from '@cardinal/common'
import type { PaidClaimApproverData } from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import {
  CLAIM_APPROVER_ADDRESS,
  CLAIM_APPROVER_IDL,
} from '@cardinal/token-manager/dist/cjs/programs/claimApprover'
import type { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import {
  TIME_INVALIDATOR_ADDRESS,
  TIME_INVALIDATOR_IDL,
} from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import type { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import {
  TOKEN_MANAGER_ADDRESS,
  TOKEN_MANAGER_IDL,
} from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import {
  USE_INVALIDATOR_ADDRESS,
  USE_INVALIDATOR_IDL,
} from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import { BorshAccountsCoder } from '@coral-xyz/anchor'
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token'
import * as splToken from '@solana/spl-token'
import type { AccountInfo, Connection, PublicKey } from '@solana/web3.js'
import type { ReactChild } from 'react'
import React, { useContext, useEffect, useMemo, useState } from 'react'

import { useEnvironmentCtx } from './EnvironmentProvider'

export type AccountTypeData = {
  type: AccountType
  timestamp: number
  displayName?: string
}

export type AccountType =
  | 'tokenManager'
  | 'paidClaimApprover'
  | 'timeInvalidator'
  | 'useInvalidator'
  | 'metaplexMetadata'
  | 'editionData'
  | 'tokenAccount'
  | 'mint'
  | 'unknown'

export type AccountCacheData = AccountInfo<Buffer> &
  AccountTypeData &
  AccountData<
    | TokenManagerData
    | PaidClaimApproverData
    | TimeInvalidatorData
    | UseInvalidatorData
    | metaplex.Metadata
    | metaplex.Edition
    | metaplex.MasterEditionV2
    | splToken.Mint
    | splToken.Account
    | null
  >

export type AccountDataById = {
  [accountId: string]: AccountCacheData
}

export const deserializeAccountInfos = (
  accountIds: (PublicKey | null)[],
  accountInfos: (AccountInfo<Buffer> | null)[]
): AccountDataById => {
  return accountInfos.reduce((acc, accountInfo, i) => {
    if (!accountInfo?.data) return acc
    const ownerString = accountInfo?.owner.toString()
    const pubkey = accountIds[i]!
    const baseData = {
      timestamp: Date.now(),
      pubkey,
    }
    switch (ownerString) {
      case TOKEN_MANAGER_ADDRESS.toString():
        try {
          const type = 'tokenManager'
          const coder = new BorshAccountsCoder(TOKEN_MANAGER_IDL)
          const parsed = coder.decode(
            type,
            accountInfo?.data as Buffer
          ) as TokenManagerData
          acc[pubkey.toString()] = {
            ...baseData,
            type,
            ...accountInfo,
            parsed,
          }
        } catch (e) {}
        return acc
      case TIME_INVALIDATOR_ADDRESS.toString():
        try {
          const type = 'timeInvalidator'
          const coder = new BorshAccountsCoder(TIME_INVALIDATOR_IDL)
          const parsed = coder.decode(
            type,
            accountInfo?.data as Buffer
          ) as TimeInvalidatorData
          acc[pubkey.toString()] = {
            ...baseData,
            type,
            ...accountInfo,
            parsed,
          }
        } catch (e) {}
        return acc
      case USE_INVALIDATOR_ADDRESS.toString():
        try {
          const type = 'useInvalidator'
          const coder = new BorshAccountsCoder(USE_INVALIDATOR_IDL)
          const parsed = coder.decode(
            type,
            accountInfo?.data as Buffer
          ) as UseInvalidatorData
          acc[pubkey.toString()] = {
            ...baseData,
            type,
            ...accountInfo,
            parsed,
          }
        } catch (e) {}
        return acc
      case CLAIM_APPROVER_ADDRESS.toString():
        try {
          const type = 'paidClaimApprover'
          const coder = new BorshAccountsCoder(CLAIM_APPROVER_IDL)
          const parsed = coder.decode(
            type,
            accountInfo?.data as Buffer
          ) as PaidClaimApproverData
          acc[pubkey.toString()] = {
            ...baseData,
            type,
            ...accountInfo,
            parsed,
          }
        } catch (e) {}
        return acc
      case TOKEN_PROGRAM_ID.toString():
        try {
          acc[pubkey.toString()] = {
            ...baseData,
            ...accountInfo,
            type: 'mint',
            parsed: splToken.unpackMint(pubkey, accountInfo),
          }
        } catch {
          try {
            acc[pubkey.toString()] = {
              ...baseData,
              ...accountInfo,
              type: 'tokenAccount',
              parsed: splToken.unpackAccount(pubkey, accountInfo),
            }
          } catch {}
        }
        return acc
      case METADATA_PROGRAM_ID.toString():
        try {
          acc[pubkey.toString()] = {
            ...baseData,
            type: 'metaplexMetadata',
            ...accountInfo,
            parsed: metaplex.Metadata.deserialize(accountInfo?.data)[0],
          }
        } catch (e) {
          try {
            acc[pubkey.toString()] = {
              ...baseData,
              type: 'editionData',
              ...accountInfo,
              parsed: metaplex.MasterEditionV2.deserialize(
                accountInfo?.data
              )[0],
            }
          } catch (e) {
            try {
              acc[pubkey.toString()] = {
                ...baseData,
                type: 'editionData',
                ...accountInfo,
                parsed: metaplex.MasterEditionV1.deserialize(
                  accountInfo?.data
                )[0],
              }
            } catch (e) {
              acc[pubkey.toString()] = {
                ...baseData,
                type: 'editionData',
                ...accountInfo,
                parsed: metaplex.Edition.deserialize(accountInfo?.data)[0],
              }
            }
          }
        }
        return acc
      default:
        const type = 'unknown'
        acc[pubkey.toString()] = {
          ...baseData,
          type,
          ...accountInfo,
          parsed: null,
        }
        return acc
    }
  }, {} as AccountDataById)
}

export const fetchAccountDataById = async (
  connection: Connection,
  ids: (PublicKey | null)[]
): Promise<AccountDataById> => {
  const filteredIds = ids.filter((id): id is PublicKey => id !== null)
  const accountInfos = await getBatchedMultipleAccounts(connection, filteredIds)
  return deserializeAccountInfos(filteredIds, accountInfos)
}

export const cacheKey = (key: PublicKey | string) => key.toString()

export interface SolanaAccountsContextValues {
  // getAccountDatum: (
  //   key: PublicKey | null
  // ) => Promise<AccountCacheData | undefined>
  // getAccountData: (
  //   keys: (PublicKey | null)[]
  // ) => Promise<(AccountCacheData | null | undefined)[]>
  getAccountDataById: (keys: (PublicKey | null)[]) => Promise<AccountDataById>
}

const SolanaAccountsContext: React.Context<SolanaAccountsContextValues> =
  React.createContext<SolanaAccountsContextValues>({
    // getAccountDatum: async () => undefined,
    // getAccountData: async () => [],
    getAccountDataById: async () => ({}),
  })

export function SolanaAccountsProvider({
  children,
  maxCacheSize = 10000,
}: {
  children: ReactChild
  maxCacheSize?: number
}) {
  const { connection, environment } = useEnvironmentCtx()
  const [accountDataById, setAccountDataById] = useState<AccountDataById>({})

  /**
   * Clear cache on environment change
   */
  useEffect(() => {
    setAccountDataById({})
  }, [environment])

  /**
   * Evict keys if over limit
   */
  useMemo(() => {
    if (Object.keys(accountDataById).length > maxCacheSize) {
      console.log(
        `Evicting cacheKeys ${
          Object.keys(accountDataById).length
        }/${maxCacheSize}`
      )
      setAccountDataById((v) =>
        Object.entries(v)
          .sort(([, v]) => v.timestamp)
          .slice(-maxCacheSize)
          .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
      )
    }
  }, [Object.keys(accountDataById).length])

  // /**
  //  * Get multiple accounts and backfill cache
  //  */
  // const getAccountData = async (keys: (PublicKey | null)[]) => {
  //   const keysToFetch = keys.filter(
  //     (key) => key && !(cacheKey(key) in accountDataById)
  //   )
  //   const fetchedData = await fetchAccountDataById(connection, keysToFetch)
  //   console.log(
  //     `[cacheMiss] (${keysToFetch.length}/${keys.length}) cacheSize: ${
  //       Object.keys(accountDataById).length
  //     }`
  //   )
  //   const results = keys.map((key) =>
  //     key ? accountDataById[cacheKey(key)] ?? fetchedData[cacheKey(key)] : null
  //   )
  //   setAccountDataById((v) => ({ ...v, ...fetchedData }))
  //   return results
  // }

  // /**
  //  * Get singular account from cache or add to cache if not found
  //  */
  // const getAccountDatum = async (key: PublicKey | null) => {
  //   if (!key) return undefined
  //   if (cacheKey(key) in accountDataById) {
  //     return accountDataById[cacheKey(key)]
  //   }
  //   console.log(`[cacheMissSingle] ${key.toString()}`)
  //   const fetchedData = await fetchAccountDataById(connection, [key])
  //   const results = accountDataById[cacheKey(key)] ?? fetchedData[cacheKey(key)]
  //   setAccountDataById((v) => ({ ...v, ...fetchedData }))
  //   return results
  // }

  /**
   * Get multiple accounts and backfill cache return as map
   */
  const getAccountDataById = async (keys: (PublicKey | null)[]) => {
    const presentKeys = keys.filter((k) => k)
    const keysToFetch = presentKeys.filter(
      (key) => key && !(cacheKey(key) in accountDataById)
    )
    const fetchedData = await fetchAccountDataById(connection, keysToFetch)
    console.log(
      `[cacheMiss] (${keysToFetch.length}/${presentKeys.length}/${
        keys.length
      }) cacheSize: ${Object.keys(accountDataById).length}`
    )
    // setAccountDataById((v) => ({ ...v, ...fetchedData }))
    const matchedData = Object.fromEntries(
      presentKeys
        .map((k) => cacheKey(k ?? ''))
        .filter((key) => key in accountDataById)
        .map((key) => [key, accountDataById[key]!])
    )
    return { ...fetchedData, ...matchedData }
  }

  return (
    <SolanaAccountsContext.Provider
      value={{
        // getAccountDatum,
        // getAccountData,
        getAccountDataById,
      }}
    >
      {children}
    </SolanaAccountsContext.Provider>
  )
}

export function useAccounts(): SolanaAccountsContextValues {
  return useContext(SolanaAccountsContext)
}
