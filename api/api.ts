import { getBatchedMultiplAccounts as getBatchedMultipleAccounts } from '@cardinal/common'
import { STAKE_POOL_ADDRESS } from '@cardinal/staking/dist/cjs/programs/stakePool'
import type { AccountData } from '@cardinal/token-manager'
import { tokenManager } from '@cardinal/token-manager/dist/cjs/programs'
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
import { findTimeInvalidatorAddress } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator/pda'
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
import { findUseInvalidatorAddress } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator/pda'
import * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import {
  Edition,
  EditionData,
  MasterEditionV2Data,
  MetadataKey,
} from '@metaplex-foundation/mpl-token-metadata'
import * as anchor from '@project-serum/anchor'
import { BorshAccountsCoder } from '@project-serum/anchor'
import { TOKEN_PROGRAM_ID } from '@project-serum/anchor/dist/cjs/utils/token'
import * as spl from '@solana/spl-token'
import type {
  AccountInfo,
  Connection,
  ParsedAccountData,
} from '@solana/web3.js'
import { Keypair, PublicKey } from '@solana/web3.js'
import type { TokenFilter } from 'config/config'

import { tryPublicKey } from './utils'

export async function findAssociatedTokenAddress(
  walletAddress: PublicKey,
  mintAddress: PublicKey
): Promise<PublicKey> {
  return (
    await PublicKey.findProgramAddress(
      [
        walletAddress.toBuffer(),
        spl.TOKEN_PROGRAM_ID.toBuffer(),
        mintAddress.toBuffer(),
      ],
      spl.ASSOCIATED_TOKEN_PROGRAM_ID
    )
  )[0]
}

export type EditionInfo = {
  pubkey: PublicKey
  parsed: metaplex.EditionData | metaplex.MasterEditionData
}

export type TokenData = {
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

/** Converts serialized tokenData or similar to TokenData */
export const convertStringsToPubkeys: any = (obj: any) => {
  if (!obj) return obj
  if (typeof obj === 'string') {
    try {
      return new anchor.BN(obj, 16)
    } catch {
      return tryPublicKey(obj) ?? obj
    }
  }
  if (obj instanceof Array) {
    return obj.map((v) => convertStringsToPubkeys(v))
  }
  if (typeof obj === 'object') {
    const convertedObject: { [key: string]: any } = {}
    Object.entries(obj).forEach(([k, v]) => {
      convertedObject[k] = convertStringsToPubkeys(v)
    })
    return convertedObject
  }
  return obj
}

export type AccountType =
  | 'metaplexMetadata'
  | 'editionData'
  | 'tokenManager'
  | 'tokenAccount'
  | 'timeInvalidator'
  | 'paidClaimApprover'
  | 'useInvalidator'
  | 'stakePool'

export type AccountTypeData = {
  type: AccountType
  displayName?: string
}

export type AccountDataById = {
  [accountId: string]:
    | (AccountData<TokenManagerData> & AccountInfo<Buffer> & AccountTypeData)
    | (AccountData<PaidClaimApproverData> &
        AccountInfo<Buffer> &
        AccountTypeData)
    | (AccountData<TimeInvalidatorData> & AccountInfo<Buffer> & AccountTypeData)
    | (AccountData<UseInvalidatorData> & AccountInfo<Buffer> & AccountTypeData)
    | (spl.AccountInfo & AccountTypeData)
    | (AccountData<metaplex.MetadataData> &
        AccountInfo<Buffer> &
        AccountTypeData)
    | (AccountData<metaplex.EditionData> &
        AccountInfo<Buffer> &
        AccountTypeData)
    | (AccountData<metaplex.MasterEditionData> &
        AccountInfo<Buffer> &
        AccountTypeData)
    | (AccountData<undefined> & AccountInfo<Buffer> & AccountTypeData)
}

export const deserializeAccountInfos = (
  accountIds: (PublicKey | null)[],
  accountInfos: (AccountInfo<Buffer | ParsedAccountData> | null)[]
): AccountDataById => {
  return accountInfos.reduce((acc, accountInfo, i) => {
    const ownerString = accountInfo?.owner.toString()
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
            type,
            pubkey: accountIds[i]!,
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
            type,
            pubkey: accountIds[i]!,
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
            type,
            pubkey: accountIds[i]!,
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
            type,
            pubkey: accountIds[i]!,
            ...(accountInfo as AccountInfo<Buffer>),
            parsed,
          }
        } catch (e) {}
        return acc
      case TOKEN_PROGRAM_ID.toString():
        try {
          acc[accountIds[i]!.toString()] = {
            type: 'tokenAccount',
            ...((accountInfo?.data as ParsedAccountData).parsed
              ?.info as spl.AccountInfo),
          }
        } catch (e) {}
        return acc
      case STAKE_POOL_ADDRESS.toString():
        try {
          acc[accountIds[i]!.toString()] = {
            type: 'stakePool',
            displayName: 'Staked',
            ...((accountInfo?.data as ParsedAccountData).parsed
              ?.info as spl.AccountInfo),
          }
        } catch (e) {}
        return acc
      case metaplex.MetadataProgram.PUBKEY.toString():
        try {
          acc[accountIds[i]!.toString()] = {
            type: 'metaplexMetadata',
            pubkey: accountIds[i]!,
            parsed: metaplex.MetadataData.deserialize(
              accountInfo?.data as Buffer
            ) as metaplex.MetadataData,
            ...(accountInfo as AccountInfo<Buffer>),
          }
        } catch (e) {}
        try {
          const key =
            accountInfo === null || accountInfo === void 0
              ? void 0
              : (accountInfo.data as Buffer)[0]
          let parsed
          if (key === MetadataKey.EditionV1) {
            parsed = EditionData.deserialize(accountInfo?.data as Buffer)
          } else if (
            key === MetadataKey.MasterEditionV1 ||
            key === MetadataKey.MasterEditionV2
          ) {
            parsed = MasterEditionV2Data.deserialize(
              accountInfo?.data as Buffer
            )
          }
          if (parsed) {
            acc[accountIds[i]!.toString()] = {
              type: 'editionData',
              pubkey: accountIds[i]!,
              parsed,
              ...(accountInfo as AccountInfo<Buffer>),
            }
          }
        } catch (e) {}
        return acc
      default:
        return acc
    }
  }, {} as AccountDataById)
}

export const accountDataById = async (
  connection: Connection,
  ids: (PublicKey | null)[]
): Promise<AccountDataById> => {
  const filteredIds = ids.filter((id): id is PublicKey => id !== null)
  const accountInfos = await getBatchedMultipleAccounts(
    connection,
    filteredIds,
    { encoding: 'jsonParsed' }
  )
  return deserializeAccountInfos(filteredIds, accountInfos)
}

export async function getTokenAccountsWithData(
  connection: Connection,
  addressId: string,
  filter?: TokenFilter,
  cluster?: string
): Promise<TokenData[]> {
  const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(
    new PublicKey(addressId),
    { programId: spl.TOKEN_PROGRAM_ID }
  )
  let tokenAccounts = allTokenAccounts.value
    .filter(
      (tokenAccount) =>
        tokenAccount.account.data.parsed.info.tokenAmount.uiAmount > 0
    )
    .sort((a, b) => a.pubkey.toBase58().localeCompare(b.pubkey.toBase58()))

  // lookup metaplex data
  const metaplexIds = await Promise.all(
    tokenAccounts.map(
      async (tokenAccount) =>
        (
          await metaplex.MetadataProgram.find_metadata_account(
            new PublicKey(tokenAccount.account.data.parsed.info.mint)
          )
        )[0]
    )
  )
  // const metaplexMetadatas = await accountDataById(connection, metaplexIds)
  // TODO use accountDataById?
  const metaplexAccountInfos = await getBatchedMultipleAccounts(
    connection,
    metaplexIds
  )
  const metaplexData = metaplexAccountInfos.reduce((acc, accountInfo, i) => {
    try {
      acc[tokenAccounts[i]!.pubkey.toString()] = {
        pubkey: metaplexIds[i]!,
        ...accountInfo,
        data: metaplex.MetadataData.deserialize(
          accountInfo?.data as Buffer
        ) as metaplex.MetadataData,
      }
    } catch (e) {}
    return acc
  }, {} as { [tokenAccountId: string]: { pubkey: PublicKey; data: metaplex.MetadataData } })

  // filter by creators
  if (filter?.type === 'creators') {
    tokenAccounts = tokenAccounts.filter((tokenAccount) =>
      metaplexData[tokenAccount.pubkey.toString()]?.data?.data?.creators?.some(
        (creator) =>
          filter.value.includes(creator.address.toString()) &&
          (cluster === 'devnet' || creator.verified)
      )
    )
  }

  // lookup delegates and
  const delegateIds = tokenAccounts.map((tokenAccount) =>
    tryPublicKey(tokenAccount.account.data.parsed.info.delegate)
  )
  const tokenAccountDelegateData = await accountDataById(
    connection,
    delegateIds
  )
  const editionIds = await Promise.all(
    tokenAccounts.map(async (tokenAccount) =>
      Edition.getPDA(tokenAccount.account.data.parsed.info.mint)
    )
  )
  const idsToFetch = Object.values(tokenAccountDelegateData).reduce(
    (acc, accountData) => [
      ...acc,
      ...(accountData.type === 'tokenManager'
        ? [
            (accountData as AccountData<TokenManagerData>).parsed.claimApprover,
            (accountData as AccountData<TokenManagerData>).parsed
              .recipientTokenAccount,
            ...(accountData as AccountData<TokenManagerData>).parsed
              .invalidators,
          ]
        : []),
    ],
    [...editionIds] as (PublicKey | null)[]
  )

  const accountsById = {
    ...tokenAccountDelegateData,
    ...(await accountDataById(connection, idsToFetch)),
  }

  const metadata = await Promise.all(
    Object.values(metaplexData).map(async (md) => {
      try {
        if (!md?.data.data.uri) return null
        const json = await fetch(md.data.data.uri).then((r) => r.json())
        return {
          pubkey: md.pubkey,
          data: json,
        }
      } catch (e) {}
    })
  )

  return tokenAccounts.map((tokenAccount, i) => {
    const delegateData =
      accountsById[tokenAccount.account.data.parsed.info.delegate]

    let tokenManagerData: AccountData<TokenManagerData> | undefined
    let claimApproverId: PublicKey | undefined
    let timeInvalidatorId: PublicKey | undefined
    let useInvalidatorId: PublicKey | undefined
    if (delegateData?.type === 'tokenManager') {
      tokenManagerData = delegateData as AccountData<TokenManagerData>
      claimApproverId = tokenManagerData.parsed.claimApprover ?? undefined
      timeInvalidatorId = tokenManagerData.parsed.invalidators.filter(
        (invalidator) =>
          accountsById[invalidator.toString()]?.type === 'timeInvalidator'
      )[0]
      useInvalidatorId = tokenManagerData.parsed.invalidators.filter(
        (invalidator) =>
          accountsById[invalidator.toString()]?.type === 'useInvalidator'
      )[0]
    }
    return {
      tokenAccount,
      metaplexData: metaplexData[tokenAccount.pubkey.toString()],
      editionData: accountsById[editionIds[i]!.toString()] as
        | {
            pubkey: PublicKey
            parsed: metaplex.EditionData | metaplex.MasterEditionData
          }
        | undefined,
      metadata: metadata.find((data) =>
        data
          ? data.pubkey.toBase58() ===
            metaplexData[tokenAccount.pubkey.toString()]?.pubkey.toBase58()
          : undefined
      ),
      tokenManager: tokenManagerData,
      claimApprover: claimApproverId
        ? (accountsById[
            claimApproverId.toString()
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
}

export async function getTokenDatas(
  connection: Connection,
  tokenManagerDatas: AccountData<TokenManagerData>[],
  filter?: TokenFilter,
  cluster?: string
): Promise<TokenData[]> {
  if (filter?.type === 'issuer') {
    tokenManagerDatas = tokenManagerDatas.filter((tm) =>
      filter.value.includes(tm.parsed.issuer.toString())
    )
  }

  const metaplexIds = await Promise.all(
    tokenManagerDatas.map(
      async (tm) =>
        (
          await metaplex.MetadataProgram.find_metadata_account(tm.parsed.mint)
        )[0]
    )
  )
  const metaplexAccountInfos = await getBatchedMultipleAccounts(
    connection,
    metaplexIds
  )
  const metaplexData = metaplexAccountInfos.reduce((acc, accountInfo, i) => {
    try {
      acc[tokenManagerDatas[i]!.pubkey.toString()] = {
        pubkey: metaplexIds[i]!,
        ...accountInfo,
        data: metaplex.MetadataData.deserialize(
          accountInfo?.data as Buffer
        ) as metaplex.MetadataData,
      }
    } catch (e) {}
    return acc
  }, {} as { [tokenManagerId: string]: { pubkey: PublicKey; data: metaplex.MetadataData } })

  if (filter?.type === 'creators') {
    tokenManagerDatas = tokenManagerDatas.filter((tm) =>
      metaplexData[tm.pubkey.toString()]?.data?.data?.creators?.some(
        (creator) =>
          filter.value.includes(creator.address.toString()) &&
          (cluster === 'devnet' || creator.verified)
      )
    )
  }

  // filter by known invalidators
  const knownTokenManagers = []
  for (const tm of tokenManagerDatas) {
    const [[timeInvalidatorId, useInvalidatorId]] = await Promise.all([
      findTimeInvalidatorAddress(tm.pubkey),
      findUseInvalidatorAddress(tm.pubkey),
    ])
    const knownInvalidators = [
      timeInvalidatorId.toString(),
      useInvalidatorId.toString(),
    ]
    let filter = false
    tm.parsed.invalidators.forEach((i) => {
      if (!knownInvalidators.includes(i.toString())) {
        filter = true
      }
    })
    if (!filter) {
      knownTokenManagers.push(tm)
    }
  }
  tokenManagerDatas = knownTokenManagers

  const idsToFetch = tokenManagerDatas.reduce(
    (acc, tm) => [
      ...acc,
      tm.parsed.claimApprover,
      ...tm.parsed.invalidators,
      tm.parsed.recipientTokenAccount,
    ],
    [] as (PublicKey | null)[]
  )
  const accountsById = await accountDataById(connection, idsToFetch)

  const metadatas = await Promise.all(
    tokenManagerDatas.map(async (tm) => {
      try {
        const metaplexDataForTokenManager = metaplexData[tm.pubkey.toString()]
        if (!metaplexDataForTokenManager?.data.data.uri) return null
        const json = await fetch(
          metaplexDataForTokenManager.data.data.uri
        ).then((r) => r.json())
        return {
          pubkey: metaplexDataForTokenManager.pubkey,
          data: json,
        }
      } catch (e) {}
    })
  )
  const metadataById = metadatas.reduce(
    (acc, md, i) => ({ ...acc, [tokenManagerDatas[i]!.pubkey.toString()]: md }),
    {} as {
      [tokenManagerId: string]:
        | { pubkey: PublicKey; data: any }
        | undefined
        | null
    }
  )

  return tokenManagerDatas.map((tokenManagerData) => {
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
      recipientTokenAccount: tokenManagerData.parsed.recipientTokenAccount
        ? (accountsById[
            tokenManagerData.parsed.recipientTokenAccount?.toString()
          ] as spl.AccountInfo)
        : undefined,
      metaplexData: metaplexData[tokenManagerData.pubkey.toString()],
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
}

export async function getTokenData(
  connection: Connection,
  tokenManagerId: PublicKey
): Promise<TokenData> {
  const tokenManagerData = await tokenManager.accounts.getTokenManager(
    connection,
    tokenManagerId
  )

  const [metaplexId] = await metaplex.MetadataProgram.find_metadata_account(
    tokenManagerData.parsed.mint
  )
  const metaplexData = await metaplex.Metadata.load(
    connection,
    metaplexId
  ).catch((e) => {
    console.log('Failed to get metaplex data', e)
    return null
  })

  // TODO lookup metaplex in parallel
  const idsToFetch = [
    // (
    //   await metaplex.MetadataProgram.find_metadata_account(
    //     tokenManagerData.parsed.mint
    //   )
    // )[0],
    tokenManagerData.parsed.claimApprover,
    tokenManagerData.parsed.recipientTokenAccount,
    ...tokenManagerData.parsed.invalidators,
  ]
  const accountsById = await accountDataById(connection, idsToFetch)

  let metadata: any | null = null
  if (metaplexData) {
    try {
      const json = await fetch(metaplexData.data.data.uri).then((r) => r.json())
      metadata = { pubkey: metaplexData.pubkey, data: json }
    } catch (e) {
      console.log('Failed to get metadata data', e)
    }
  }

  let recipientTokenAccount: spl.AccountInfo | null = null
  if (tokenManagerData?.parsed.recipientTokenAccount) {
    try {
      const mint = new spl.Token(
        connection,
        tokenManagerData?.parsed.mint,
        spl.TOKEN_PROGRAM_ID,
        Keypair.generate() // not used
      )
      recipientTokenAccount = await mint.getAccountInfo(
        tokenManagerData?.parsed.recipientTokenAccount
      )
    } catch (e) {
      console.log('Failed to get recipient token account', e)
    }
  }

  const timeInvalidatorId = tokenManagerData.parsed.invalidators.filter(
    (invalidator) =>
      accountsById[invalidator.toString()]?.owner.equals(
        TIME_INVALIDATOR_ADDRESS
      )
  )[0]
  const useInvalidatorId = tokenManagerData.parsed.invalidators.filter(
    (invalidator) =>
      accountsById[invalidator.toString()]?.owner.equals(
        USE_INVALIDATOR_ADDRESS
      )
  )[0]
  return {
    metaplexData,
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
    metadata,
    recipientTokenAccount,
  }
}
