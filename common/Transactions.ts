import {
  Transaction,
  Connection,
  sendAndConfirmRawTransaction,
  Signer,
  ConfirmOptions,
} from '@solana/web3.js'
import { Wallet } from '@saberhq/solana-contrib'
import { notify } from 'common/Notification'

export const executeTransaction = async (
  connection: Connection,
  wallet: Wallet,
  transaction: Transaction,
  config: {
    silent?: boolean
    signers?: Signer[]
    confirmOptions?: ConfirmOptions
    notificationConfig?: { message?: string; errorMessage?: string }
    callback?: Function
  }
): Promise<string> => {
  let txid = ''
  try {
    transaction.feePayer = wallet.publicKey
    transaction.recentBlockhash = (
      await connection.getRecentBlockhash('max')
    ).blockhash
    await wallet.signTransaction(transaction)
    if (config.signers && config.signers.length > 0) {
      await transaction.partialSign(...config.signers)
    }
    txid = await sendAndConfirmRawTransaction(
      connection,
      transaction.serialize(),
      config.confirmOptions
    )
    console.log('Successful tx', txid)
    config.notificationConfig &&
      notify({
        message: config.notificationConfig.message ?? 'Succesful transaction',
        txid,
      })
  } catch (e) {
    console.log('Failed transaction: ', e)
    config.notificationConfig &&
      notify({
        message:
          config.notificationConfig.errorMessage ?? `Failed transaction: ${e}`,
        txid,
        type: 'error',
      })
    if (!config.silent) throw new Error(`${e}`)
  } finally {
    config.callback && config.callback()
  }
  return txid
}
