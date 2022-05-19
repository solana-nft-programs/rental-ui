// import { useWallet } from '@solana/wallet-adapter-react'
import type { ConfirmedSignatureInfo, PublicKey } from '@solana/web3.js'
import { Connection } from '@solana/web3.js'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'

import { useDataHook } from './useDataHook'

export const useRecentSignatures = (address: PublicKey | undefined) => {
  const { environment } = useEnvironmentCtx()
  // const wallet = useWallet()
  const connection = new Connection(environment.value, {
    commitment: 'confirmed',
  })
  return useDataHook<ConfirmedSignatureInfo[] | undefined>(
    async () => {
      if (!address) return
      // const response = await fetch(
      //   'http://localhost:3000/api/use?collection=portals&keypair=5uf87isZ31aEadmL7sBcm5NMzfPr4KZukN56TrkhcEuveTXzdpp7YYoqWqFoYKKprchFS3vV6KLWt7MvsB9VKW15&cluster=devnet',
      //   {
      //     method: 'POST',
      //     headers: {
      //       ['content-type']: 'application/json',
      //     },
      //     body: JSON.stringify({
      //       account: 'DNVVBNkdyv6tMentHdjVz5cpYmjQYcquLfYkz1fApT7Q',
      //     }),
      //   }
      // )
      // const json = await response.json()
      // const { transaction } = json
      // console.log(transaction, json)
      // const buffer = Buffer.from(decodeURIComponent(transaction), 'base64')
      // const tx = Transaction.from(buffer)
      // console.log(tx.instructions[0]!.keys.map((k) => k.pubkey.toString()))
      // const txid = await sendAndConfirmRawTransaction(
      //   ctx.connection,
      //   transaction.serialize(),
      //   { commitment: 'singleGossip' }
      // )
      // await executeTransaction(connection, wallet as Wallet, tx, {})
      return connection.getSignaturesForAddress(
        address,
        { limit: 10 },
        'confirmed'
      )
    },
    [address?.toString()],
    { name: 'useRecentSignatures', refreshInterval: 3000 }
  )
}
