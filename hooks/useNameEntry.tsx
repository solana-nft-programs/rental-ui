import { getNameEntry } from '@solana-nft-programs/namespaces'
import { useQuery } from '@tanstack/react-query'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'

const DEFAULT_NAMESPACE = 'twitter'

export const useNameEntry = (name?: string, disabled?: boolean) => {
  const { secondaryConnection } = useEnvironmentCtx()
  return useQuery(
    ['NAME_ENTRY', name],
    async () => {
      if (!name) return
      return getNameEntry(secondaryConnection, DEFAULT_NAMESPACE, name)
    },
    {
      enabled: !!name && !disabled,
    }
  )
}
