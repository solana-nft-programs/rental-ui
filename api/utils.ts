import {
  CreateMasterEditionV3,
  CreateMetadataV2,
  DataV2,
  MasterEdition,
  Metadata,
} from '@metaplex-foundation/mpl-token-metadata'
import { BN } from '@project-serum/anchor'
import {
  SignerWallet,
  SolanaProvider,
  TransactionEnvelope,
  Wallet,
} from '@saberhq/solana-contrib'
import * as splToken from '@solana/spl-token'
import * as web3 from '@solana/web3.js'
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'

/**
 * Pay and create mint and token account
 * @param connection
 * @param creator
 * @returns
 */
export const createMint = async (
  connection: web3.Connection,
  creator: web3.Keypair,
  recipient: web3.PublicKey,
  amount = 1,
  freezeAuthority: web3.PublicKey = recipient
): Promise<[web3.PublicKey, splToken.Token]> => {
  const mint = await splToken.Token.createMint(
    connection,
    creator,
    creator.publicKey,
    freezeAuthority,
    0,
    splToken.TOKEN_PROGRAM_ID
  )
  const tokenAccount = await mint.createAssociatedTokenAccount(recipient)
  await mint.mintTo(tokenAccount, creator.publicKey, [], amount)
  return [tokenAccount, mint]
}

type SimpleMetadata = { name: string; symbol: string; uri: string }
const airdropMetadata: SimpleMetadata[] = [
  {
    name: 'Portals',
    symbol: 'PRTL',
    uri: 'https://arweave.net/-QsrbBfmFy4Fxp-BtSnSFiajm_KECo5ctRXR6uSBS5k',
  },
  {
    name: 'Portals',
    symbol: 'PRTL',
    uri: 'https://arweave.net/RewRYM3lf-1Ry1hitgsiXuqsuERSujlTAChgl9S483c',
  },
  {
    name: 'Portals',
    symbol: 'PRTL',
    uri: 'https://arweave.net/6ZcTxyREtg0WsOSGSBq-CSyQ3DPlU1k4R_A7mrgehRE',
  },
  // {
  //   name: 'Origin Jambo',
  //   symbol: 'JAMB',
  //   uri: 'https://arweave.net/XBoDa9TqiOZeXW_6bV8wvieD8fMQS6IHxKipwdvduCo',
  // },
  // {
  //   name: 'Solana Monkey Business',
  //   symbol: 'SMB',
  //   uri: 'https://arweave.net/VjfB54_BbELJ5bc1kH-kddrXfq5noloSjkcvK2Odhh0',
  // },
  // {
  //   name: 'Degen Ape',
  //   symbol: 'DAPE',
  //   uri: 'https://arweave.net/mWra8rTxavmbCnqxs6KoWwa0gC9uM8NMeOsyVhDy0-E',
  // },
  // {
  //   name: 'Degen Ape',
  //   symbol: 'DAPE',
  //   uri: 'https://arweave.net/s32upFrSiC1aQsEJ1QJev6pglLw0T2r6XTR3CtRAQ00',
  // },
  // {
  //   name: 'Degen Ape',
  //   symbol: 'DAPE',
  //   uri: 'https://arweave.net/nw6rAQZx5n1rfZDMlk-Mn9iA4-ZBJdVuU6Els3B6LUA'
  // },
  // {
  //   name: 'Thugbirdz',
  //   symbol: 'THUG',
  //   uri: 'https://arweave.net/l9VXqVWCsiKW-R8ShX8jknFPgBibrhQI1JRgUI9uvbw',
  // },
  // {
  //   name: 'Turtles',
  //   symbol: 'TRTL',
  //   uri: 'https://arweave.net/KKbhlHaPMOB9yMm9yG_i7PxzK0y24I5C7gNTaRDI9OE',
  // },
  // {
  //   name: 'Ghostz',
  //   symbol: 'GSTZ',
  //   uri: '"https://arweave.net/83xQ5R-M01o9FoW-EIembwEbwEmTv49HmO06lBsy4Lk"',
  // },
  // {
  //   name: 'Shi Guardians',
  //   symbol: 'SHI',
  //   uri: 'https://arweave.net/hSI4WIsX10yRWnzgXP8oqwSCaSgPfGU5nSN-Pxjslao',
  // },
  // {
  //   name: 'Hacker House',
  //   symbol: 'HH',
  //   uri: 'https://arweave.net/DLDhnabWSXzAYktEhEKyukt3GIfagj2rPpWncw-KDQo',
  // },
  // {
  //   name: '21 Club',
  //   symbol: '21',
  //   uri: 'https://bafkreicv3jj6oc53kid76mkk7hqsr6edrnhsydkw4do4vonq777sgfz3le.ipfs.dweb.link?ext=json',
  // },
  // {
]
export async function airdropNFT(
  connection: Connection,
  wallet: Wallet
): Promise<string> {
  const randInt = Math.round(Math.random() * (airdropMetadata.length - 1))
  const metadata: SimpleMetadata = airdropMetadata[randInt]!
  const tokenCreator = Keypair.generate()
  const fromAirdropSignature = await connection.requestAirdrop(
    tokenCreator.publicKey,
    LAMPORTS_PER_SOL
  )
  await connection.confirmTransaction(fromAirdropSignature)

  const [_masterEditionTokenAccountId, masterEditionMint] = await createMint(
    connection,
    tokenCreator,
    wallet.publicKey,
    1,
    tokenCreator.publicKey
  )

  const masterEditionMetadataId = await Metadata.getPDA(
    masterEditionMint.publicKey
  )
  const metadataTx = new CreateMetadataV2(
    { feePayer: tokenCreator.publicKey },
    {
      metadata: masterEditionMetadataId,
      metadataData: new DataV2({
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        sellerFeeBasisPoints: 10,
        creators: null,
        collection: null,
        uses: null,
      }),
      updateAuthority: tokenCreator.publicKey,
      mint: masterEditionMint.publicKey,
      mintAuthority: tokenCreator.publicKey,
    }
  )

  const masterEditionId = await MasterEdition.getPDA(
    masterEditionMint.publicKey
  )
  const masterEditionTx = new CreateMasterEditionV3(
    {
      feePayer: tokenCreator.publicKey,
      recentBlockhash: (await connection.getRecentBlockhash('max')).blockhash,
    },
    {
      edition: masterEditionId,
      metadata: masterEditionMetadataId,
      updateAuthority: tokenCreator.publicKey,
      mint: masterEditionMint.publicKey,
      mintAuthority: tokenCreator.publicKey,
      maxSupply: new BN(1),
    }
  )

  const txEnvelope = new TransactionEnvelope(
    SolanaProvider.init({
      connection: connection,
      wallet: new SignerWallet(tokenCreator),
      opts: {
        commitment: 'singleGossip',
      },
    }),
    [...metadataTx.instructions, ...masterEditionTx.instructions]
  )
  const pendingTX = await txEnvelope.send({
    commitment: 'singleGossip',
  })
  console.log(
    `Master edition (${masterEditionId.toString()}) created with metadata (${masterEditionMetadataId.toString()})`
  )
  return pendingTX.signature
}

export async function getATokenAccountInfo(
  connection: Connection,
  mint: web3.PublicKey,
  owner: web3.PublicKey
): Promise<splToken.AccountInfo> {
  const aTokenAccount = await splToken.Token.getAssociatedTokenAddress(
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    splToken.TOKEN_PROGRAM_ID,
    mint,
    owner
  )
  const token = new splToken.Token(
    connection,
    mint,
    splToken.TOKEN_PROGRAM_ID,
    // @ts-ignore
    null
  )
  return token.getAccountInfo(aTokenAccount)
}

export const tryPublicKey = (
  publicKeyString: string | string[] | undefined
): web3.PublicKey | null => {
  if (!publicKeyString) return null
  try {
    return new web3.PublicKey(publicKeyString)
  } catch (e) {
    return null
  }
}
