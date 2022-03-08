import React, { useState, useContext, useEffect, ReactChild } from 'react'
import { useUserTokenData } from './TokenDataProvider'
import { useEnvironmentCtx } from './EnvironmentProvider'
import { getTokenDatas, TokenData } from 'api/api'
import { getTokenManagersByState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import { TokenManagerState } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'

export interface IssuedTokensContextValues {
  issuedTokens: TokenData[]
  refreshIssuedTokens: Function
  refreshing: Boolean
  loaded: Boolean
  error: String | null
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
  const { connection } = useEnvironmentCtx()
  const { tokenDatas } = useUserTokenData()
  const [issuedTokens, setIssuedTokens] = useState<TokenData[]>([])
  const [refreshing, setRefreshing] = useState<Boolean>(false)
  const [loaded, setLoaded] = useState<Boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const refreshIssuedTokens = async () => {
    try {
      setRefreshing(true)
      const tokenManagerDatas = await getTokenManagersByState(
        connection,
        TokenManagerState.Issued
      )
      const tokenDatas = await getTokenDatas(connection, tokenManagerDatas)
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
  }, [connection, setError, setRefreshing, tokenDatas])

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
