import type { PublicKey } from '@solana/web3.js'

export function transactionUrl(txid: string, cluster: string) {
  return `https://explorer.solana.com/tx/${txid}${
    cluster === 'devnet' ? '?cluster=devnet' : ''
  }`
}

export function metadataUrl(
  pubkey: PublicKey | null | undefined,
  cluster: string
) {
  if (!pubkey) return 'https://www.magiceden.io/item-details/'
  return `https://www.magiceden.io/item-details/${pubkey.toString()}${
    cluster === 'devnet' ? '?cluster=devnet' : ''
  }`
}
