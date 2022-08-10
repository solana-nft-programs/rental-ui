import { tryPublicKey } from '@cardinal/namespaces-components'
import { useWallet } from '@solana/wallet-adapter-react'
import { firstParam } from 'common/utils'
import { useRouter } from 'next/router'

import { useNameEntry } from './useNameEntry'

export const useWalletId = () => {
  const wallet = useWallet()
  const { query } = useRouter()
  const tryWalletId =
    tryPublicKey(query.wallet) ?? wallet.publicKey ?? undefined
  const nameEntry = useNameEntry(
    firstParam(query.wallet),
    !(query.wallet && !tryPublicKey(query.wallet))
  )
  return nameEntry.data?.parsed.data ?? tryWalletId
}
