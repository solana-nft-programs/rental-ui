import React, { useState, useContext, useEffect, ReactChild } from 'react'
import { useUserTokenData } from './TokenDataProvider'
import { useEnvironmentCtx } from './EnvironmentProvider'
import { web3 } from '@project-serum/anchor'
import { getTokenManagersForIssuerUnsafe } from '@cardinal/token-manager/dist/cjs/programs/receiptIndex'
import { getTokenDatas, TokenData } from 'api/api'

export interface ManagedTokensContextValues {
  managedTokens: TokenData[]
  refreshManagedTokens: Function
  refreshing: Boolean
  loaded: Boolean
  error: String | null
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
  const { connection } = useEnvironmentCtx()
  const { address, tokenDatas } = useUserTokenData()
  const [managedTokens, setManagedTokens] = useState<TokenData[]>([])
  const [refreshing, setRefreshing] = useState<Boolean>(false)
  const [loaded, setLoaded] = useState<Boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const refreshManagedTokens = async () => {
    if (!address) {
      setError(`Address not set please connect wallet to continue`)
      return
    }
    try {
      setRefreshing(true)
      const tokenManagerDatas = await getTokenManagersForIssuerUnsafe(
        connection,
        new web3.PublicKey(address)
      )
      const tokenDatas = await getTokenDatas(connection, tokenManagerDatas)
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
