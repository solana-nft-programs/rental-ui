import type { Wallet } from '@saberhq/solana-contrib'
import type {
  ConfirmOptions,
  Connection,
  Signer,
  Transaction,
} from '@solana/web3.js'
import { sendAndConfirmRawTransaction } from '@solana/web3.js'
import { handleError } from 'api/errors'
import { notify } from 'common/Notification'

export const executeTransaction = async (
  connection: Connection,
  wallet: Wallet,
  transaction: Transaction,
  config: {
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
        message: 'Succesful transaction',
        description: config.notificationConfig.message,
        txid,
      })
  } catch (e) {
    console.log('Failed transaction: ', e)
    const errorMessage = handleError(e)
    config.notificationConfig &&
      notify({
        message: 'Failed transaction',
        description: config.notificationConfig.errorMessage ?? errorMessage,
        txid,
        type: 'error',
      })
    if (!config.silent) throw new Error(errorMessage)
  } finally {
    config.callback && config.callback()
  }
  return txid
}
