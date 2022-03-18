import * as splToken from '@solana/spl-token'
import type { Connection } from '@solana/web3.js'
import * as web3 from '@solana/web3.js'

export async function getATokenAccountInfo(
  connection: Connection,
  mint: web3.PublicKey,
  owner: web3.PublicKey
): Promise<splToken.AccountInfo> {
  const aTokenAccount = await splToken.Token.getAssociatedTokenAddress(
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    splToken.TOKEN_PROGRAM_ID,
    mint,
    owner
  )
  const token = new splToken.Token(
    connection,
    mint,
    splToken.TOKEN_PROGRAM_ID,
    // @ts-ignore
    null
  )
  return token.getAccountInfo(aTokenAccount)
}

export const tryPublicKey = (
  publicKeyString: string | string[] | undefined
): web3.PublicKey | null => {
  if (!publicKeyString) return null
  try {
    return new web3.PublicKey(publicKeyString)
  } catch (e) {
    return null
  }
}
