import {
  Transaction,
  Connection,
  sendAndConfirmRawTransaction,
  Signer,
} from '@solana/web3.js'
import { Wallet } from '@saberhq/solana-contrib'

export const executeTransaction = async (
  connection: Connection,
  wallet: Wallet,
  transaction: Transaction,
  signers?: Signer[]
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
    transaction.serialize()
  )
  console.log('Successful tx', txid)
  return txid
}
