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
import { BorshAccountsCoder } from '@project-serum/anchor'
import { TOKEN_PROGRAM_ID } from '@project-serum/anchor/dist/cjs/utils/token'
import * as spl from '@solana/spl-token'
import { u64 } from '@solana/spl-token'
import type {
  AccountInfo,
  Connection,
  ParsedAccountData,
} from '@solana/web3.js'
import { PublicKey } from '@solana/web3.js'
import type { ReactChild } from 'react'
import React, { useContext, useEffect, useMemo, useState } from 'react'

import { useEnvironmentCtx } from './EnvironmentProvider'

export type ParsedTokenAccountData = {
  isNative: boolean
  delegate: string
  mint: string
  owner: string
  state: 'initialized' | 'frozen'
  tokenAmount: {
    amount: string
    decimals: number
    uiAmount: number
    uiAmountString: string
  }
}

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
    | ParsedTokenAccountData
    | spl.MintInfo
    | null
  >

export type AccountDataById = {
  [accountId: string]: AccountCacheData
}

export const deserializeAccountInfos = (
  accountIds: (PublicKey | null)[],
  accountInfos: (AccountInfo<Buffer | ParsedAccountData> | null)[]
): AccountDataById => {
  return accountInfos.reduce((acc, accountInfo, i) => {
    const ownerString = accountInfo?.owner.toString()
    const baseData = {
      timestamp: Date.now(),
      pubkey: accountIds[i]!,
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
          acc[accountIds[i]!.toString()] = {
            ...baseData,
            type,
            ...(accountInfo as AccountInfo<Buffer>),
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
          acc[accountIds[i]!.toString()] = {
            ...baseData,
            type,
            ...(accountInfo as AccountInfo<Buffer>),
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
          acc[accountIds[i]!.toString()] = {
            ...baseData,
            type,
            ...(accountInfo as AccountInfo<Buffer>),
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
          acc[accountIds[i]!.toString()] = {
            ...baseData,
            type,
            ...(accountInfo as AccountInfo<Buffer>),
            parsed,
          }
        } catch (e) {}
        return acc
      case TOKEN_PROGRAM_ID.toString():
        if (accountInfo?.data && 'parsed' in accountInfo?.data) {
          const accountData = accountInfo?.data
          acc[accountIds[i]!.toString()] =
            accountData.space === spl.MintLayout.span
              ? {
                  ...baseData,
                  type: 'mint',
                  ...(accountInfo as AccountInfo<Buffer>),
                  parsed: accountData.parsed?.info as spl.MintInfo,
                }
              : {
                  ...baseData,
                  type: 'tokenAccount',
                  ...(accountInfo as AccountInfo<Buffer>),
                  parsed: accountData.parsed?.info as ParsedTokenAccountData,
                }
          // taken from account deserialization in splToken getMintInfo
        } else if (
          accountInfo?.data &&
          'length' in accountInfo?.data &&
          accountInfo?.data.length === spl.MintLayout.span
        ) {
          const parsed = spl.MintLayout.decode(accountInfo?.data)
          if (parsed.mintAuthorityOption === 0) {
            parsed.mintAuthority = null
          } else {
            parsed.mintAuthority = new PublicKey(parsed.mintAuthority)
          }
          parsed.supply = u64.fromBuffer(parsed.supply)
          parsed.isInitialized = parsed.isInitialized !== 0
          if (parsed.freezeAuthorityOption === 0) {
            parsed.freezeAuthority = null
          } else {
            parsed.freezeAuthority = new PublicKey(parsed.freezeAuthority)
          }
          acc[accountIds[i]!.toString()] = {
            ...baseData,
            type: 'mint',
            ...(accountInfo as AccountInfo<Buffer>),
            parsed: parsed as spl.MintInfo,
          }
        } else if (
          accountInfo?.data &&
          'length' in accountInfo?.data &&
          accountInfo?.data.length === spl.AccountLayout.span
        ) {
          try {
            // taken from account deserialization in splToken getAccountInfo
            const parsed = spl.AccountLayout.decode(accountInfo?.data)
            parsed.address = accountIds[i]!
            parsed.mint = new PublicKey(parsed.mint)
            parsed.owner = new PublicKey(parsed.owner)
            parsed.amount = u64.fromBuffer(parsed.amount)
            if (parsed.delegateOption === 0) {
              parsed.delegate = null
              parsed.delegatedAmount = new u64(0)
            } else {
              parsed.delegate = new PublicKey(parsed.delegate)
              parsed.delegatedAmount = u64.fromBuffer(parsed.delegatedAmount)
            }

            parsed.isInitialized = parsed.state !== 0
            parsed.isFrozen = parsed.state === 2

            if (parsed.isNativeOption === 1) {
              parsed.rentExemptReserve = u64.fromBuffer(parsed.isNative)
              parsed.isNative = true
            } else {
              parsed.rentExemptReserve = null
              parsed.isNative = false
            }

            if (parsed.closeAuthorityOption === 0) {
              parsed.closeAuthority = null
            } else {
              parsed.closeAuthority = new PublicKey(parsed.closeAuthority)
            }
            acc[accountIds[i]!.toString()] = {
              ...baseData,
              type: 'mint',
              ...(accountInfo as AccountInfo<Buffer>),
              parsed: parsed as ParsedTokenAccountData,
            }
          } catch {}
        }
        return acc
      case METADATA_PROGRAM_ID.toString():
        if (accountInfo?.data) {
          try {
            acc[accountIds[i]!.toString()] = {
              ...baseData,
              type: 'metaplexMetadata',
              ...(accountInfo as AccountInfo<Buffer>),
              parsed: metaplex.Metadata.deserialize(
                accountInfo?.data as Buffer
              )[0],
            }
          } catch (e) {
            try {
              acc[accountIds[i]!.toString()] = {
                ...baseData,
                type: 'editionData',
                ...(accountInfo as AccountInfo<Buffer>),
                parsed: metaplex.MasterEditionV2.deserialize(
                  accountInfo?.data as Buffer
                )[0],
              }
            } catch (e) {
              try {
                acc[accountIds[i]!.toString()] = {
                  ...baseData,
                  type: 'editionData',
                  ...(accountInfo as AccountInfo<Buffer>),
                  parsed: metaplex.MasterEditionV1.deserialize(
                    accountInfo?.data as Buffer
                  )[0],
                }
              } catch (e) {
                acc[accountIds[i]!.toString()] = {
                  ...baseData,
                  type: 'editionData',
                  ...(accountInfo as AccountInfo<Buffer>),
                  parsed: metaplex.Edition.deserialize(
                    accountInfo?.data as Buffer
                  )[0],
                }
              }
            }
          }
        }
        return acc
      default:
        const type = 'unknown'
        acc[accountIds[i]!.toString()] = {
          ...baseData,
          type,
          ...(accountInfo as AccountInfo<Buffer>),
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
