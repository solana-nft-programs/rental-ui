// import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type { TokenData } from 'api/api'
import type { DataHookValues } from 'hooks/useDataHook'
import { useTokenManagers } from 'hooks/useTokenManagers'
import type { ReactChild } from 'react'
import React, { useContext } from 'react'

const IssuedTokensContext: React.Context<DataHookValues<TokenData[]>> =
  React.createContext<DataHookValues<TokenData[]>>({
    loaded: false,
    refresh: async () => {},
    refreshing: false,
    error: undefined,
    data: undefined,
  })

export function IssuedTokensProvider({ children }: { children: ReactChild }) {
  const tokenManagers = useTokenManagers()
  return (
    <IssuedTokensContext.Provider
      value={{
        ...tokenManagers,
      }}
    >
      {children}
    </IssuedTokensContext.Provider>
  )
}

export function useIssuedTokens(): DataHookValues<TokenData[]> {
  return useContext(IssuedTokensContext)
}
