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
import type * as web3 from '@solana/web3.js'
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
    name: 'Origin Jambo',
    symbol: 'JAMB',
    uri: 'https://arweave.net/XBoDa9TqiOZeXW_6bV8wvieD8fMQS6IHxKipwdvduCo',
  },
  {
    name: 'Hacker House',
    symbol: 'HH',
    uri: '"https://arweave.net/DLDhnabWSXzAYktEhEKyukt3GIfagj2rPpWncw-KDQo"',
  },
  {
    name: '21 Club',
    symbol: '21',
    uri: '"https://bafkreicv3jj6oc53kid76mkk7hqsr6edrnhsydkw4do4vonq777sgfz3le.ipfs.dweb.link?ext=json"',
  },
  {
    name: 'Ticket',
    symbol: 'TIX',
    uri: 'https://arweave.net/fsepehu-6DtTorFJZfPLux-yu1XpMcAQKtiADk6zWXI',
  },
]
export async function airdropNFT(
  connection: Connection,
  wallet: Wallet
): Promise<string> {
  const randInt = Math.round(Math.random() * (airdropMetadata.length - 1))
  const metadata: SimpleMetadata = airdropMetadata[randInt]
  const tokenCreator = Keypair.generate()
  const fromAirdropSignature = await connection.requestAirdrop(
    tokenCreator.publicKey,
    LAMPORTS_PER_SOL
  )
  await connection.confirmTransaction(fromAirdropSignature)

  const [masterEditionTokenAccountId, masterEditionMint] = await createMint(
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
