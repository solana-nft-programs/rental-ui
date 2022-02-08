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

export async function airdropNFT(connection: Connection, wallet: Wallet) {
  const tokenCreator = new Keypair()
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
    wallet.publicKey
  )

  const masterEditionMetadataId = await Metadata.getPDA(
    masterEditionMint.publicKey
  )
  const metadataTx = new CreateMetadataV2(
    { feePayer: wallet.publicKey },
    {
      metadata: masterEditionMetadataId,
      metadataData: new DataV2({
        name: 'Origina Jambo',
        symbol: 'JAMB',
        uri: `https://arweave.net/XBoDa9TqiOZeXW_6bV8wvieD8fMQS6IHxKipwdvduCo`,
        sellerFeeBasisPoints: 10,
        creators: null,
        collection: null,
        uses: null,
      }),
      updateAuthority: wallet.publicKey,
      mint: masterEditionMint.publicKey,
      mintAuthority: wallet.publicKey,
    }
  )

  const masterEditionId = await MasterEdition.getPDA(
    masterEditionMint.publicKey
  )
  const masterEditionTx = new CreateMasterEditionV3(
    {
      feePayer: wallet.publicKey,
      recentBlockhash: (await connection.getRecentBlockhash('max')).blockhash,
    },
    {
      edition: masterEditionId,
      metadata: masterEditionMetadataId,
      updateAuthority: wallet.publicKey,
      mint: masterEditionMint.publicKey,
      mintAuthority: wallet.publicKey,
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
  await txEnvelope.send({
    commitment: 'singleGossip',
  })
  console.log(
    `Master edition (${masterEditionId.toString()}) created with metadata (${masterEditionMetadataId.toString()})`
  )
}
