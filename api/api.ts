import {
  AccountInfo,
  ParsedAccountData,
  PublicKey,
  Connection,
} from '@solana/web3.js'
import * as anchor from '@project-serum/anchor'
import * as spl from '@solana/spl-token'
import * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import { tryTokenManagerAddressFromMint } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/pda'
import {
  timeInvalidator,
  tokenManager,
  useInvalidator,
} from '@cardinal/token-manager/dist/cjs/programs'
import { AccountData } from '@cardinal/token-manager'
import { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'

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
  metaplexData?: metaplex.Metadata | null
  editionData?: metaplex.Edition
  metadata?: any
  useInvalidator?: AccountData<UseInvalidatorData>
  timeInvalidator?: AccountData<TimeInvalidatorData>
}

export async function getTokenAccountsWithData(
  connection: Connection,
  addressId: String
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
    PublicKey | null,
    PublicKey | null,
    PublicKey | null,
    PublicKey
  ][] = await Promise.all(
    tokenAccounts.map(async (tokenAccount) => {
      const [[metadataId], tokenManagerId] = await Promise.all([
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
        tryTokenManagerAddressFromMint(
          connection,
          new PublicKey(tokenAccount.account.data.parsed.info.mint)
        ),
      ])

      let timeInvalidatorId = null
      let useInvalidatorId = null
      if (tokenManagerId) {
        ;[[timeInvalidatorId], [useInvalidatorId]] = await Promise.all([
          timeInvalidator.pda.findTimeInvalidatorAddress(tokenManagerId),
          useInvalidator.pda.findUseInvalidatorAddress(tokenManagerId),
        ])
      }

      return [
        metadataId,
        tokenManagerId,
        timeInvalidatorId,
        useInvalidatorId,
        tokenAccount.pubkey,
      ]
    })
  )

  // @ts-ignore
  const metadataIds: [PublicKey[], PublicKey[], PublicKey[], PublicKey[]] =
    // @ts-ignore
    metadataTuples.reduce(
      (
        acc,
        [metaplexId, tokenManagerId, timeInvalidatorId, useInvalidatorId]
      ) => [
        [...acc[0], metaplexId],
        [...acc[1], tokenManagerId],
        [...acc[2], timeInvalidatorId],
        [...acc[3], useInvalidatorId],
      ],
      [[], [], [], []]
    )

  const metaplexData = await Promise.all(
    metadataIds[0].map(async (id) => {
      try {
        return await metaplex.Metadata.load(connection, id)
      } catch (e) {
        // console.log(e)
        return null
      }
    })
  )
  const metadata = await Promise.all(
    metaplexData.map(async (md) => {
      try {
        if (!md?.data.data.uri) return null
        const json = await fetch(md.data.data.uri).then((r) => r.json())
        return { pubkey: md.pubkey, data: json }
      } catch (e) {
        // console.log(e)
        return null
      }
    })
  )

  console.log(metadataIds[1].map((i) => i.toString()))
  metadataIds[1].forEach((tmid) => {
    tokenManager.accounts
      .getTokenManager(connection, tmid)
      .then((tm) => console.log(tm))
      .catch((e) => console.log(e))
  })
  const [tokenManagers, timeInvalidators, useInvalidators] = await Promise.all([
    tokenManager.accounts.getTokenManagers(connection, metadataIds[1]),
    timeInvalidator.accounts.getTimeInvalidators(connection, metadataIds[2]),
    useInvalidator.accounts.getUseInvalidators(connection, metadataIds[3]),
  ])
  console.log(tokenManagers)
  return metadataTuples.map(
    ([
      metaplexId,
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

  let metaplexData: metaplex.Metadata | null = null
  let metadata: any | null = null
  let timeInvalidatorData: TimeInvalidatorData | null = null
  let useInvalidatorData: UseInvalidatorData | null = null

  try {
    metaplexData = await metaplex.Metadata.load(connection, metaplexId)
  } catch (e) {
    console.log('Failed to get metaplex data', e)
  }

  if (metaplexData) {
    try {
      const json = await fetch(metaplexData.data.data.uri).then((r) => r.json())
      metadata = { pubkey: metaplexData.pubkey, data: json }
    } catch (e) {
      console.log('Failed to get metadata data', e)
    }
  }

  try {
    timeInvalidatorData = await timeInvalidator.accounts.getTimeInvalidator(
      connection,
      timeInvalidatorId
    )
  } catch (e) {
    console.log('Failed to get time invalidator data', e)
  }

  try {
    useInvalidatorData = await useInvalidator.accounts.getUseInvalidator(
      connection,
      useInvalidatorId
    )
  } catch (e) {
    console.log('Failed to get use invalidator data', e)
  }

  return {
    metaplexData,
    tokenManager: tokenManagerData,
    useInvalidator: useInvalidatorData,
    timeInvalidator: timeInvalidatorData,
    metadata,
  }
}
