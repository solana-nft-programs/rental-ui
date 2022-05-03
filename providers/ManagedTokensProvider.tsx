import { getTokenManagersForIssuer } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import { web3 } from '@project-serum/anchor'
import type { TokenData } from 'api/api'
import { getTokenDatas } from 'api/api'
import type { ReactChild } from 'react'
import React, { useContext, useEffect, useState } from 'react'

import { useEnvironmentCtx } from './EnvironmentProvider'
import { filterTokens, useProjectConfig } from './ProjectConfigProvider'
import { useUserTokenData } from './TokenDataProvider'

export interface ManagedTokensContextValues {
  managedTokens: TokenData[]
  refreshManagedTokens: () => void
  refreshing: boolean
  loaded: boolean
  error: string | null
}

const ManagedTokensContext: React.Context<ManagedTokensContextValues> =
  React.createContext<ManagedTokensContextValues>({
    managedTokens: [],
    refreshManagedTokens: () => {},
    refreshing: true,
    loaded: false,
    error: null,
  })

export function ManagedTokensProvider({ children }: { children: ReactChild }) {
  const { connection, environment } = useEnvironmentCtx()
  const { address, tokenDatas } = useUserTokenData()
  const [managedTokens, setManagedTokens] = useState<TokenData[]>([])
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [loaded, setLoaded] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const { config } = useProjectConfig()

  const refreshManagedTokens = async () => {
    if (!address) {
      setError(`Address not set please connect wallet to continue`)
      return
    }
    try {
      if (!config) return
      setRefreshing(true)
      const tokenManagerDatas = await getTokenManagersForIssuer(
        connection,
        new web3.PublicKey(address)
      )
      let tokenDatas = await getTokenDatas(connection, tokenManagerDatas)
      tokenDatas = filterTokens(environment.label, tokenDatas, config.filter)
      setManagedTokens(tokenDatas)
    } catch (e) {
      console.log(e)
      setError(`${e}`)
    } finally {
      setLoaded(true)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    refreshManagedTokens()
  }, [connection, setError, address, tokenDatas, setRefreshing])

  return (
    <ManagedTokensContext.Provider
      value={{
        managedTokens,
        refreshManagedTokens,
        refreshing,
        loaded,
        error,
      }}
    >
      {children}
    </ManagedTokensContext.Provider>
  )
}

export function useManagedTokens(): ManagedTokensContextValues {
  return useContext(ManagedTokensContext)
}
