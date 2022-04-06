import { getTokenManagersForIssuer } from '@cardinal/token-manager/dist/cjs/programs/tokenManager/accounts'
import { web3 } from '@project-serum/anchor'
import type { TokenData } from 'api/api'
import { getTokenDatas } from 'api/api'
import axios from 'axios'
import type { ReactChild } from 'react'
import React, { useContext, useEffect, useState } from 'react'

import { useEnvironmentCtx } from './EnvironmentProvider'
import { filterTokens, useProjectConfig } from './ProjectConfigProvider'
import { useUserTokenData } from './TokenDataProvider'

export interface ManagedTokensContextValues {
  internalClaims: { [k: string]: string }
  managedTokens: TokenData[]
  refreshManagedTokens: () => void
  refreshing: boolean
  loaded: boolean
  error: string | null
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

      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_REMI_COIN_URL}/api/claims`,
        {
          params: {
            tokenManagerIds: managedTokens
              .map((td) => td?.tokenManager?.pubkey.toString())
              .join(),
          },
          // headers: { 'Access-Control-Allow-Origin': '*' },
        }
      )

      const tokenManagerDatas = await getTokenManagersForIssuer(
        connection,
        new web3.PublicKey(address)
      )
      let tokenDatas = await getTokenDatas(connection, tokenManagerDatas)
      tokenDatas = filterTokens(config.filters, tokenDatas)
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
  }, [connection, setError, address, tokenDatas, setRefreshing])

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
