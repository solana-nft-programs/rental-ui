import * as web3 from '@solana/web3.js'
import * as splToken from '@solana/spl-token'
import * as BufferLayout from '@solana/buffer-layout'
import { Wallet } from '@saberhq/solana-contrib'
import { withFindOrInitAssociatedTokenAccount } from '@cardinal/certificates'

export async function withWrapSol(
  transaction: web3.Transaction,
  connection: web3.Connection,
  wallet: Wallet,
  lamports: number
): Promise<web3.Transaction> {
  console.log(`Wrapping ${lamports} lamports`)
  const nativeAssociatedTokenAccountId =
    await withFindOrInitAssociatedTokenAccount(
      transaction,
      connection,
      splToken.NATIVE_MINT,
      wallet.publicKey,
      wallet.publicKey
    )
  transaction.add(
    web3.SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: nativeAssociatedTokenAccountId,
      lamports,
    })
  )
  transaction.add(createSyncNativeInstruction(nativeAssociatedTokenAccountId))
  return transaction
}

export function createSyncNativeInstruction(
  nativeAccount: web3.PublicKey
): web3.TransactionInstruction {
  // @ts-ignore
  const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')])
  const data = Buffer.alloc(dataLayout.span)
  dataLayout.encode(
    {
      instruction: 17, // SyncNative instruction
    },
    data
  )

  let keys = [{ pubkey: nativeAccount, isSigner: false, isWritable: true }]
  return new web3.TransactionInstruction({
    keys,
    programId: splToken.TOKEN_PROGRAM_ID,
    data,
  })
}
