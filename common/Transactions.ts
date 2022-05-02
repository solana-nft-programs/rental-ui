import type { Wallet } from '@saberhq/solana-contrib'
import type {
  ConfirmOptions,
  Connection,
  PublicKey,
  Signer,
  Transaction,
} from '@solana/web3.js'
import { sendAndConfirmRawTransaction } from '@solana/web3.js'
import { notify } from 'common/Notification'

export const executeTransaction = async (
  connection: Connection,
  wallet: Wallet,
  transaction: Transaction,
  config: {
    feePayer?: PublicKey
    silent?: boolean
    signers?: Signer[]
    confirmOptions?: ConfirmOptions
    notificationConfig?: {
      message?: string
      errorMessage?: string
      description?: string
    }
    callback?: () => void
  }
): Promise<string> => {
  let txid = ''
  try {
    transaction.feePayer = config.feePayer ?? wallet.publicKey
    // transaction.feePayer = wallet.publicKey
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
        message: 'Succesful transaction',
        description: config.notificationConfig.message,
        txid,
      })
  } catch (e) {
    console.log('Failed transaction: ', e)
    config.notificationConfig &&
      notify({
        message: 'Failed transaction',
        description: config.notificationConfig.errorMessage ?? `${e}`,
        txid,
        type: 'error',
      })
    if (!config.silent) throw new Error(`${e}`)
  } finally {
    config.callback && config.callback()
  }
  return txid
}
