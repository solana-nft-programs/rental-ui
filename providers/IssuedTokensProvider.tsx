import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import { getTokenManagersByState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import type { TokenData } from 'api/api'
import { getTokenDatas } from 'api/api'
import type { ReactChild } from 'react'
import React, { useContext, useEffect, useState } from 'react'

import { useEnvironmentCtx } from './EnvironmentProvider'
import { filterTokens, useProjectConfig } from './ProjectConfigProvider'
import { useUserTokenData } from './TokenDataProvider'

export interface IssuedTokensContextValues {
  issuedTokens: TokenData[]
  refreshIssuedTokens: () => void
  refreshing: boolean
  loaded: boolean
  error: string | null
}

const IssuedTokensContext: React.Context<IssuedTokensContextValues> =
  React.createContext<IssuedTokensContextValues>({
    issuedTokens: [],
    refreshIssuedTokens: () => {},
    refreshing: true,
    loaded: false,
    error: null,
  })

export function IssuedTokensProvider({ children }: { children: ReactChild }) {
  const { config } = useProjectConfig()
  const { connection } = useEnvironmentCtx()
  const { tokenDatas } = useUserTokenData()
  const [issuedTokens, setIssuedTokens] = useState<TokenData[]>([])
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [loaded, setLoaded] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const refreshIssuedTokens = async () => {
    try {
      if (!config) return
      setRefreshing(true)
      const tokenManagerDatas = await getTokenManagersByState(
        connection,
        TokenManagerState.Issued
      )
      let tokenDatas = await getTokenDatas(connection, tokenManagerDatas)
      tokenDatas = filterTokens(config.filters, tokenDatas)
      console.log(tokenDatas, connection)
      setIssuedTokens(tokenDatas)
    } catch (e) {
      console.log(e)
      setError(`${e}`)
    } finally {
      setLoaded(true)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    refreshIssuedTokens()
  }, [connection, setError, setRefreshing, tokenDatas, config])

  return (
    <IssuedTokensContext.Provider
      value={{
        issuedTokens,
        refreshIssuedTokens,
        refreshing,
        loaded,
        error,
      }}
    >
      {children}
    </IssuedTokensContext.Provider>
  )
}

export function useIssuedTokens(): IssuedTokensContextValues {
  return useContext(IssuedTokensContext)
}
