import React, { useState, useContext, useEffect, ReactChild } from 'react'
import { useUserTokenData } from './TokenDataProvider'
import { useEnvironmentCtx } from './EnvironmentProvider'
import { web3 } from '@project-serum/anchor'
import { getTokenDatas, TokenData } from 'api/api'
import { getTokenManagersForIssuer } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import { filterTokens, useProjectConfigData } from './ProjectConfigProvider'
import axios from 'axios'

export interface ManagedTokensContextValues {
  internalClaims: { [k: string]: string }
  managedTokens: TokenData[]
  refreshManagedTokens: Function
  refreshing: Boolean
  loaded: Boolean
  error: String | null
}

const ManagedTokensContext: React.Context<ManagedTokensContextValues> =
  React.createContext<ManagedTokensContextValues>({
    internalClaims: {},
    managedTokens: [],
    refreshManagedTokens: () => {},
    refreshing: true,
    loaded: false,
    error: null,
  })

export function ManagedTokensProvider({ children }: { children: ReactChild }) {
  const { connection } = useEnvironmentCtx()
  const { address, tokenDatas } = useUserTokenData()
  const [internalClaims, setInternalClaims] = useState<any>({})
  const [managedTokens, setManagedTokens] = useState<TokenData[]>([])
  const [refreshing, setRefreshing] = useState<Boolean>(false)
  const [loaded, setLoaded] = useState<Boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const { filters, configLoaded } = useProjectConfigData()

  const refreshManagedTokens = async () => {
    if (!address) {
      setError(`Address not set please connect wallet to continue`)
      return
    }
    try {
      if (!configLoaded) return
      setRefreshing(true)

      const { data } = await axios.get(`/api/claims`, {
        params: {
          tokenManagerIds: managedTokens
            .map((td) => td?.tokenManager?.pubkey.toString())
            .join(),
        },
      })

      const tokenManagerDatas = await getTokenManagersForIssuer(
        connection,
        new web3.PublicKey(address)
      )
      let tokenDatas = await getTokenDatas(connection, tokenManagerDatas)
      tokenDatas = filterTokens(filters, tokenDatas)
      setManagedTokens(tokenDatas)

      if (data?.claims.length)
        setInternalClaims(
          data.claims.reduce((acc: any, c: any) => {
            acc[`${c.tokenManagerId}`] = c.email
            return acc
          }, {})
        )
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
  }, [connection, setError, address, tokenDatas, setRefreshing, filters, configLoaded])

  return (
    <ManagedTokensContext.Provider
      value={{
        managedTokens,
        internalClaims,
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
