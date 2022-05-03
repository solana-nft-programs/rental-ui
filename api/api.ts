import { getBatchedMultiplAccounts as getBatchedMultipleAccounts } from '@cardinal/common'
import type { AccountData } from '@cardinal/token-manager'
import {
  claimApprover,
  timeInvalidator,
  tokenManager,
  useInvalidator,
} from '@cardinal/token-manager/dist/cjs/programs'
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
import { tryTokenManagerAddressFromMint } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/pda'
import type { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
import {
  USE_INVALIDATOR_ADDRESS,
  USE_INVALIDATOR_IDL,
} from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'
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
import { PublicKey } from '@solana/web3.js'
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

export type TokenData = {
  tokenAccount?: {
    pubkey: PublicKey
    account: AccountInfo<ParsedAccountData>
  }
  tokenManager?: AccountData<TokenManagerData>
  metaplexData?: { pubkey: PublicKey; data: metaplex.MetadataData } | null
  editionData?: {
    pubkey: PublicKey
    data: metaplex.EditionData | metaplex.MasterEditionData
  } | null
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

export async function getTokenAccountsWithData(
  connection: Connection,
  addressId: string
): Promise<TokenData[]> {
  const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(
    new PublicKey(addressId),
    { programId: spl.TOKEN_PROGRAM_ID }
  )
  const tokenAccounts = allTokenAccounts.value
    .filter(
      (tokenAccount) =>
        tokenAccount.account.data.parsed.info.tokenAmount.uiAmount > 0
    )
    .sort((a, b) => a.pubkey.toBase58().localeCompare(b.pubkey.toBase58()))

  const metadataTuples: [
    PublicKey,
    PublicKey,
    PublicKey | null,
    PublicKey | null,
    PublicKey | null,
    PublicKey
  ][] = await Promise.all(
    tokenAccounts.map(async (tokenAccount) => {
      const [[metadataId], editionId, tokenManagerId] = await Promise.all([
        PublicKey.findProgramAddress(
          [
            anchor.utils.bytes.utf8.encode(metaplex.MetadataProgram.PREFIX),
            metaplex.MetadataProgram.PUBKEY.toBuffer(),
            new PublicKey(
              tokenAccount.account.data.parsed.info.mint
            ).toBuffer(),
          ],
          metaplex.MetadataProgram.PUBKEY
        ),
        Edition.getPDA(tokenAccount.account.data.parsed.info.mint),
        tryTokenManagerAddressFromMint(
          connection,
          new PublicKey(tokenAccount.account.data.parsed.info.mint)
        ),
      ])

      let timeInvalidatorId = null
      let useInvalidatorId = null
      if (tokenManagerId)
        [[timeInvalidatorId], [useInvalidatorId]] = await Promise.all([
          timeInvalidator.pda.findTimeInvalidatorAddress(tokenManagerId),
          useInvalidator.pda.findUseInvalidatorAddress(tokenManagerId),
        ])

      return [
        metadataId,
        editionId,
        tokenManagerId,
        timeInvalidatorId,
        useInvalidatorId,
        tokenAccount.pubkey,
      ]
    })
  )

  const metadataIds: [
    PublicKey[],
    PublicKey[],
    (PublicKey | null)[],
    (PublicKey | null)[],
    (PublicKey | null)[]
  ] = metadataTuples.reduce(
    (
      acc,
      [
        metaplexId,
        editionId,
        tokenManagerId,
        timeInvalidatorId,
        useInvalidatorId,
      ]
    ) => [
      [...acc[0], metaplexId],
      [...acc[1], editionId],
      [...acc[2], tokenManagerId],
      [...acc[3], timeInvalidatorId],
      [...acc[4], useInvalidatorId],
    ],
    [[], [], [], [], []] as [
      PublicKey[],
      PublicKey[],
      (PublicKey | null)[],
      (PublicKey | null)[],
      (PublicKey | null)[]
    ]
  )

  const [
    metaplexAccountInfos,
    editionInfos,
    tokenManagers,
    timeInvalidators,
    useInvalidators,
  ] = await Promise.all([
    getBatchedMultipleAccounts(connection, metadataIds[0]),
    getBatchedMultipleAccounts(connection, metadataIds[1]),
    tokenManager.accounts.getTokenManagers(
      connection,
      metadataIds[2].filter((pk) => pk) as PublicKey[]
    ),
    timeInvalidator.accounts.getTimeInvalidators(
      connection,
      metadataIds[3].filter((pk) => pk) as PublicKey[]
    ),
    useInvalidator.accounts.getUseInvalidators(
      connection,
      metadataIds[4].filter((pk) => pk) as PublicKey[]
    ),
  ])

  const metaplexData = metaplexAccountInfos.map((accountInfo, i) => {
    let md
    try {
      md = {
        pubkey: metadataIds[0][i]!,
        ...accountInfo,
        data: metaplex.MetadataData.deserialize(accountInfo?.data as Buffer),
      }
    } catch (e) {}
    return md
  })

  const editionData = editionInfos.map((accountInfo, i) => {
    let md
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
        parsed = MasterEditionV2Data.deserialize(accountInfo?.data as Buffer)
      }

      if (parsed) {
        md = {
          pubkey: metadataIds[1][i]!,
          ...accountInfo,
          data: parsed,
        }
      }
    } catch (e) {}
    return md
  })

  const metadata = await Promise.all(
    metaplexData.map(async (md) => {
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

  return metadataTuples.map(
    ([
      metaplexId,
      editionId,
      tokenManagerId,
      timeInvalidatorId,
      useInvalidatorId,
      tokenAccountId,
    ]) => ({
      tokenAccount: tokenAccounts.find((data) =>
        data ? data.pubkey.toBase58() === tokenAccountId.toBase58() : undefined
      ),
      metaplexData: metaplexData.find((data) =>
        data ? data.pubkey.toBase58() === metaplexId.toBase58() : undefined
      ),
      editionData: editionData.find((data) =>
        data ? data.pubkey.toBase58() === editionId.toBase58() : undefined
      ),
      tokenManager: tokenManagers.find((tkm) =>
        tkm?.parsed
          ? tkm.pubkey.toBase58() === tokenManagerId?.toBase58()
          : undefined
      ),
      metadata: metadata.find((data) =>
        data ? data.pubkey.toBase58() === metaplexId.toBase58() : undefined
      ),
      useInvalidator: useInvalidators.find((data) =>
        data?.parsed
          ? data.pubkey.toBase58() === useInvalidatorId?.toBase58()
          : undefined
      ),
      timeInvalidator: timeInvalidators.find((data) =>
        data?.parsed
          ? data.pubkey.toBase58() === timeInvalidatorId?.toBase58()
          : undefined
      ),
    })
  )
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

  const idsToFetch = tokenManagerDatas
    .reduce(
      (acc, tm) => [
        ...acc,
        tm.parsed.claimApprover,
        ...tm.parsed.invalidators,
        tm.parsed.recipientTokenAccount,
      ],
      [] as (PublicKey | null)[]
    )
    .filter((id) => id) as PublicKey[]

  const rawData = await getBatchedMultipleAccounts(connection, idsToFetch, {
    encoding: 'jsonParsed',
  })
  const accountsById = rawData.reduce(
    (acc, accountInfo, i) => {
      const ownerString = accountInfo?.owner.toString()
      switch (ownerString) {
        case TIME_INVALIDATOR_ADDRESS.toString():
          try {
            const coder = new BorshAccountsCoder(TIME_INVALIDATOR_IDL)
            const parsed = coder.decode(
              'timeInvalidator',
              accountInfo?.data as Buffer
            ) as TimeInvalidatorData
            acc[idsToFetch[i]!.toString()] = {
              pubkey: idsToFetch[i]!,
              ...(accountInfo as AccountInfo<Buffer>),
              parsed,
            }
          } catch (e) {}
          return acc
        case USE_INVALIDATOR_ADDRESS.toString():
          try {
            const coder = new BorshAccountsCoder(USE_INVALIDATOR_IDL)
            const parsed = coder.decode(
              'useInvalidator',
              accountInfo?.data as Buffer
            ) as UseInvalidatorData
            acc[idsToFetch[i]!.toString()] = {
              pubkey: idsToFetch[i]!,
              ...(accountInfo as AccountInfo<Buffer>),
              parsed,
            }
          } catch (e) {}
          return acc
        case CLAIM_APPROVER_ADDRESS.toString():
          try {
            const coder = new BorshAccountsCoder(CLAIM_APPROVER_IDL)
            const parsed = coder.decode(
              'paidClaimApprover',
              accountInfo?.data as Buffer
            ) as PaidClaimApproverData
            acc[idsToFetch[i]!.toString()] = {
              pubkey: idsToFetch[i]!,
              ...(accountInfo as AccountInfo<Buffer>),
              parsed,
            }
          } catch (e) {}
          return acc
        case TOKEN_PROGRAM_ID.toString():
          try {
            acc[idsToFetch[i]!.toString()] = (
              accountInfo?.data as ParsedAccountData
            ).parsed?.info as spl.AccountInfo
          } catch (e) {}
          return acc
        default:
          return acc
      }
    },
    {} as {
      [accountId: string]:
        | (AccountData<PaidClaimApproverData> & AccountInfo<Buffer>)
        | (AccountData<TimeInvalidatorData> & AccountInfo<Buffer>)
        | (AccountData<UseInvalidatorData> & AccountInfo<Buffer>)
        | spl.AccountInfo
        | undefined
        | null
    }
  )

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

  const mintId = tokenManagerData.parsed.mint
  const [[metaplexId]] = await Promise.all([
    PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(metaplex.MetadataProgram.PREFIX),
        metaplex.MetadataProgram.PUBKEY.toBuffer(),
        mintId.toBuffer(),
      ],
      metaplex.MetadataProgram.PUBKEY
    ),
  ])

  const [[timeInvalidatorId], [useInvalidatorId]] = await Promise.all([
    timeInvalidator.pda.findTimeInvalidatorAddress(tokenManagerId),
    useInvalidator.pda.findUseInvalidatorAddress(tokenManagerId),
  ])

  const [
    metaplexData,
    timeInvalidatorData,
    useInvalidatorData,
    claimApproverData,
  ] = await Promise.all([
    metaplex.Metadata.load(connection, metaplexId).catch((e) => {
      console.log('Failed to get metaplex data', e)
      return null
    }),
    timeInvalidator.accounts
      .getTimeInvalidator(connection, timeInvalidatorId)
      .catch((e) => {
        console.log('Failed to get time invalidator data', e)
        return null
      }),
    useInvalidator.accounts
      .getUseInvalidator(connection, useInvalidatorId)
      .catch((e) => {
        console.log('Failed to get use invalidator data', e)
        return null
      }),
    claimApprover.accounts
      .getClaimApprover(connection, tokenManagerId)
      .catch((e) => {
        console.log('Failed to get use invalidator data', e)
        return null
      }),
  ])

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
        // @ts-ignore
        null
      )
      recipientTokenAccount = await mint.getAccountInfo(
        tokenManagerData?.parsed.recipientTokenAccount
      )
    } catch (e) {
      console.log('Failed to get recipient token account', e)
    }
  }

  return {
    metaplexData,
    tokenManager: tokenManagerData,
    claimApprover:
      tokenManagerData.parsed.claimApprover?.toString() ===
      claimApproverData?.pubkey?.toString()
        ? claimApproverData
        : undefined,
    useInvalidator: useInvalidatorData,
    timeInvalidator: timeInvalidatorData,
    metadata,
    recipientTokenAccount,
  }
}
