import type { TokenData } from 'api/api'
import type { DataHookValues } from 'hooks/useDataHook'
// import { useFilteredTokenManagers } from 'hooks/useFilteredTokenManagers'
import { useTokenManagers } from 'hooks/useTokenManagers'
import type { ReactChild } from 'react'
import React, { useContext } from 'react'

import { useEnvironmentCtx } from './EnvironmentProvider'
import { filterTokens, useProjectConfig } from './ProjectConfigProvider'

const TokenManagersContext: React.Context<DataHookValues<TokenData[]>> =
  React.createContext<DataHookValues<TokenData[]>>({
    loaded: false,
    refresh: async () => {},
    refreshing: false,
    error: undefined,
    data: undefined,
  })

export function TokenManagersProvider({ children }: { children: ReactChild }) {
  const tokenManagers = useTokenManagers()
  const { config } = useProjectConfig()
  const { environment } = useEnvironmentCtx()
  const filteredTokenManagers = filterTokens(
    environment.label,
    config.filters,
    tokenManagers.data ?? []
  )
  return (
    <TokenManagersContext.Provider
      value={{
        ...tokenManagers,
        data: filteredTokenManagers,
      }}
    >
      {children}
    </TokenManagersContext.Provider>
  )
}

export function useAllTokenManagers(): DataHookValues<TokenData[]> {
  return useContext(TokenManagersContext)
}
