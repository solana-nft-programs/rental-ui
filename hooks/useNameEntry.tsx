import { getNameEntry } from '@cardinal/namespaces'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useQuery } from '@tanstack/react-query'

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
