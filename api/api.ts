import {
  AccountInfo,
  ParsedAccountData,
  PublicKey,
  Connection,
} from '@solana/web3.js'
import * as anchor from '@project-serum/anchor'
import * as spl from '@solana/spl-token'
import { EnvironmentContextValues } from 'providers/EnvironmentProvider'
import * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import { findTokenManagerAddress } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/pda'
import {
  timeInvalidator,
  tokenManager,
  useInvalidator,
} from '@cardinal/token-manager/dist/cjs/programs'
import { AccountData } from '@cardinal/token-manager'
import { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { TimeInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/timeInvalidator'
import { UseInvalidatorData } from '@cardinal/token-manager/dist/cjs/programs/useInvalidator'

export type TokenInfo = {
  issuer: PublicKey
  mintAddress: PublicKey
  metadataUrl?: string
  tokenName?: string
  tokenSymbol?: string
  tokenImageUrl?: string
  tags?: Array<string>
}

export type Issuer = {
  address: PublicKey
  name: string
  imageUrl?: string
}

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
  metadata?: any
  useInvalidator?: AccountData<UseInvalidatorData>
  timeInvalidator?: AccountData<TimeInvalidatorData>
}

export async function getTokenAccountsWithData(
  ctx: EnvironmentContextValues,
  addressId: String
): Promise<TokenData[]> {
  const allTokenAccounts = await ctx.connection.getParsedTokenAccountsByOwner(
    new PublicKey(addressId),
    { programId: spl.TOKEN_PROGRAM_ID }
  )
  const tokenAccounts = allTokenAccounts.value
    .filter(
      (tokenAccount) =>
        tokenAccount.account.data.parsed.info.tokenAmount.uiAmount > 0
    )
    .sort((a, b) => a.pubkey.toBase58().localeCompare(b.pubkey.toBase58()))

  const metadataTuples = await Promise.all(
    tokenAccounts.map(async (tokenAccount) =>
      Promise.all([
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
        findTokenManagerAddress(
          new PublicKey(tokenAccount.account.data.parsed.info.mint)
        ),
        tokenAccount,
      ])
    )
  )

  //   @ts-ignore
  const metadataIds: [PublicKey[], PublicKey[]] = metadataTuples.reduce(
    (acc, [metaplexId, tokenManagerId]) => [
      [...acc[0], metaplexId[0]],
      [...acc[1], tokenManagerId[0]],
    ],
    [[], []]
  )

  const metaplexData = await Promise.all(
    metadataIds[0].map(async (id) => {
      try {
        return await metaplex.Metadata.load(ctx.connection, id)
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

  const tokenManagers = await tokenManager.accounts.getTokenManagers(
    ctx.connection,
    metadataIds[1]
  )
  return metadataTuples.map(([metaplexId, certificateId, tokenAccount]) => ({
    tokenAccount,
    metaplexData: metaplexData.find((data) =>
      data ? data.pubkey.toBase58() === metaplexId[0].toBase58() : undefined
    ),
    // @ts-ignore
    tokenManager: tokenManagers.find((tkm) =>
      tkm?.parsed
        ? tkm.pubkey.toBase58() === certificateId[0].toBase58()
        : undefined
    ),
    metadata: metadata.find((data) =>
      data ? data.pubkey.toBase58() === metaplexId[0].toBase58() : undefined
    ),
  }))
}

export async function getTokenData(
  connection: Connection,
  mintId: PublicKey
): Promise<TokenData> {
  console.log(mintId)
  const [[metaplexId], [tokenManagerId]] = await Promise.all([
    PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(metaplex.MetadataProgram.PREFIX),
        metaplex.MetadataProgram.PUBKEY.toBuffer(),
        mintId.toBuffer(),
      ],
      metaplex.MetadataProgram.PUBKEY
    ),
    findTokenManagerAddress(mintId),
  ])

  const [[timeInvalidatorId], [useInvalidatorId]] = await Promise.all([
    timeInvalidator.pda.findTimeInvalidatorAddress(tokenManagerId),
    useInvalidator.pda.findUseInvalidatorAddress(mintId),
  ])

  let metaplexData: metaplex.Metadata | null = null
  let metadata: any | null = null
  let tokenManagerData: TokenManagerData | null = null
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
    tokenManagerData = await tokenManager.accounts.getTokenManager(
      connection,
      tokenManagerId
    )
  } catch (e) {
    console.log('Failed to get token manager data', e)
  }

  try {
    timeInvalidatorData = await timeInvalidator.accounts.getUseInvalidator(
      connection,
      timeInvalidatorId
    )
  } catch (e) {
    console.log('Failed to get token manager data', e)
  }

  try {
    useInvalidatorData = await useInvalidator.accounts.getUseInvalidator(
      connection,
      useInvalidatorId
    )
  } catch (e) {
    console.log('Failed to get token manager data', e)
  }

  return {
    metaplexData,
    tokenManager: tokenManagerData,
    useInvalidator: useInvalidatorData,
    timeInvalidator: timeInvalidatorData,
    metadata,
  }
}

export async function getMintInfo(
  connection: Connection,
  mintId: String
): Promise<spl.MintInfo> {
  const mintPublicKey = new PublicKey(mintId)
  const token = new spl.Token(
    connection,
    mintPublicKey,
    spl.TOKEN_PROGRAM_ID,
    // @ts-ignore
    null
  )
  return await token.getMintInfo()
}

export async function getATokenAccountInfo(
  ctx: EnvironmentContextValues,
  mint: PublicKey,
  owner: PublicKey
): Promise<spl.AccountInfo> {
  const aTokenAccount = await spl.Token.getAssociatedTokenAddress(
    spl.ASSOCIATED_TOKEN_PROGRAM_ID,
    spl.TOKEN_PROGRAM_ID,
    mint,
    owner
  )
  // @ts-ignore
  const token = new spl.Token(ctx.connection, mint, spl.TOKEN_PROGRAM_ID, null)
  return token.getAccountInfo(aTokenAccount)
}
