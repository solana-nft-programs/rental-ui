import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import type { Connection, PublicKey } from '@solana/web3.js'
import type { AccountData } from '@solana-nft-programs/common'
import { useQuery } from '@tanstack/react-query'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'

import { useWalletId } from './useWalletId'

export type ParsedTokenAccountData = {
  isNative: boolean
  delegate: string
  mint: string
  owner: string
  state: 'initialized' | 'frozen'
  tokenAmount: {
    amount: number
    decimals: number
    uiAmount: number
    uiAmountString: string
  }
}

export const getTokenAccounts = async (
  connection: Connection,
  walletId: PublicKey
) => {
  const allTokenAccounts = await connection.getParsedTokenAccountsByOwner(
    walletId,
    {
      programId: TOKEN_PROGRAM_ID,
    }
  )
  return allTokenAccounts.value
    .filter(
      (tokenAccount) =>
        tokenAccount.account.data.parsed.info.tokenAmount.uiAmount > 0
    )
    .sort((a, b) => a.pubkey.toBase58().localeCompare(b.pubkey.toBase58()))
    .map((tokenAccount) => ({
      pubkey: tokenAccount.pubkey,
      parsed: tokenAccount.account.data.parsed.info as ParsedTokenAccountData,
    }))
}

export const useTokenAccounts = () => {
  const { connection } = useEnvironmentCtx()
  const walletId = useWalletId()
  return useQuery<AccountData<ParsedTokenAccountData>[]>(
    ['useTokenAccounts', walletId?.toString()],
    async () => {
      if (!walletId) return []
      return getTokenAccounts(connection, walletId)
    },
    {
      enabled: !!walletId,
    }
  )
}
