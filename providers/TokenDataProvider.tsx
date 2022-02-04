import { getTokenAccountsWithData } from 'api/api'
import React, {
  useState,
  useContext,
  useCallback,
  useEffect,
  ReactChild,
} from 'react'
import { useEnvironmentCtx } from './EnvironmentProvider'

export interface TokenData {
  tokenAccount: any
  metaplexData: any
  certificateData: any
  arweaveData: any
}

export interface UserTokenDataValues {
  tokenDatas: TokenData[]
  getTokenAccounts: Function
  setTokenDatas: (newEnvironment: TokenData[]) => void
  setAddress: (address: String) => void
  refreshing: boolean
  address: String | null
  error: String | null
}

const UserTokenData: React.Context<UserTokenDataValues> =
  React.createContext<UserTokenDataValues>({
    tokenDatas: [],
    getTokenAccounts: () => {},
    setTokenDatas: () => {},
    setAddress: () => {},
    refreshing: true,
    address: null,
    error: null,
  })

export function TokenAccountsProvider({ children }: { children: ReactChild }) {
  const ctx = useEnvironmentCtx()
  const [address, setAddress] = useState(null)
  const [error, setError] = useState<string | null>(null)
  const [tokenDatas, setTokenDatas] = useState([])
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const getTokenAccounts = useCallback(() => {
    console.log(ctx, address)
    if (ctx) {
      if (!address) {
        setError(`Address not set please connect wallet to continue`)
        return
      }
      setRefreshing(true)
      setError(null)
      getTokenAccountsWithData(ctx, address)
        .then((tokenDatas) => {
          setTokenDatas(tokenDatas.filter((td) => td.metaplexData))
        })
        .catch((e) => {
          console.log(e)
          setError(`${e}`)
        })
        .finally(() => {
          setRefreshing(false)
        })
    }
  }, [ctx, setError, address, setRefreshing])

  useEffect(() => {
    const interval = setInterval(
      (function getTokenAccountsInterval(): any {
        getTokenAccounts()
        return getTokenAccountsInterval
      })(),
      10000
    )
    return () => clearInterval(interval)
  }, [getTokenAccounts])

  return (
    <UserTokenData.Provider
      value={{
        address,
        tokenDatas,
        getTokenAccounts,
        setTokenDatas,
        setAddress,
        refreshing,
        error,
      }}
    >
      {children}
    </UserTokenData.Provider>
  )
}

export function useUserTokenData(): UserTokenDataValues {
  const context = useContext(UserTokenData)
  return context
}
