import { getNameEntry } from '@cardinal/namespaces'
import { tryPublicKey } from '@cardinal/namespaces-components'
import { useWallet } from '@solana/wallet-adapter-react'
import { firstParam } from 'common/utils'
import { useRouter } from 'next/router'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useQuery } from 'react-query'

const DEFAULT_NAMESPACE = 'twitter'

export const useWalletId = () => {
  const wallet = useWallet()
  const { query } = useRouter()
  const { connection } = useEnvironmentCtx()
  const tryWalletId =
    tryPublicKey(query.wallet) ?? wallet.publicKey ?? undefined

  const reverseEntryForName = useQuery(
    ['REVERSE_ENTRY', query.walletId],
    async () => {
      if (query.wallet && !tryPublicKey(query.wallet)) {
        const reverseEntry = await getNameEntry(
          connection,
          DEFAULT_NAMESPACE,
          firstParam(query.wallet)
        )
        if (reverseEntry.parsed.data) {
          return reverseEntry.parsed.data
        }
      }
    },
    {
      enabled: !!(query.wallet && !tryPublicKey(query.wallet)),
    }
  )
  return reverseEntryForName.data ?? tryWalletId
}
