import {
  Transaction,
  Connection,
  sendAndConfirmRawTransaction,
  Signer,
  ConfirmOptions,
} from '@solana/web3.js'
import { Wallet } from '@saberhq/solana-contrib'

export const executeTransaction = async (
  connection: Connection,
  wallet: Wallet,
  transaction: Transaction,
  signers?: Signer[],
  confirmOptions?: ConfirmOptions
): Promise<string> => {
  transaction.feePayer = wallet.publicKey
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash('max')
  ).blockhash
  await wallet.signTransaction(transaction)
  if (signers) {
    await transaction.partialSign(...signers)
  }
  const txid = await sendAndConfirmRawTransaction(
    connection,
    transaction.serialize(),
    confirmOptions
  )
  console.log('Successful tx', txid)
  return txid
}
