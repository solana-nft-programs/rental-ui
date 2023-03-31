import * as splToken from '@solana/spl-token'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import type { PublicKey } from '@solana/web3.js'
import { Connection } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'

import { useWalletId } from './useWalletId'

export const useUserPaymentTokenAccount = (mint: PublicKey | undefined) => {
  const walletId = useWalletId()
  const { environment } = useEnvironmentCtx()
  const connection = new Connection(environment.primary, {
    commitment: 'confirmed',
  })
  return useQuery<splToken.Account | undefined>(
    ['useUserPaymentTokenAccount', walletId?.toString(), mint?.toString()],
    async () => {
      if (!mint || !walletId) return
      return splToken.getAccount(
        connection,
        getAssociatedTokenAddressSync(mint, walletId)
      )
    },
    {}
  )
}
