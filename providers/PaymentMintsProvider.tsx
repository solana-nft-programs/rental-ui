import React, { useState, useContext, useEffect, ReactChild } from 'react'
import { useEnvironmentCtx } from './EnvironmentProvider'
import * as splToken from '@solana/spl-token'
import { web3 } from '@project-serum/anchor'

export const PAYMENT_MINTS = [
  {
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
  },
  {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
  },
  {
    mint: 'Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1',
    symbol: 'SBR',
  },
]

export interface PaymentMintsContextValues {
  paymentMintInfos: { [name: string]: splToken.MintInfo }
  refreshPaymentMints: Function
  refreshing: boolean
  error: string | null
}

const PaymentMintsContext: React.Context<PaymentMintsContextValues> =
  React.createContext<PaymentMintsContextValues>({
    paymentMintInfos: {},
    refreshPaymentMints: () => {},
    refreshing: false,
    error: null,
  })

export function PaymentMintsProvider({ children }: { children: ReactChild }) {
  const ctx = useEnvironmentCtx()
  const [paymentMintInfos, setPaymentMintInfos] = useState({})
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshPaymentMints = async () => {
    setRefreshing(true)
    const paymentMintInfoMap: { [k: string]: splToken.MintInfo } = {}
    for (let i = 0; i < PAYMENT_MINTS.length; i++) {
      try {
        const paymentToken = new splToken.Token(
          ctx.connection,
          new web3.PublicKey(PAYMENT_MINTS[i].mint),
          splToken.TOKEN_PROGRAM_ID,
          // @ts-ignore
          null
        )
        const mintInfo = await paymentToken.getMintInfo()
        paymentMintInfoMap[PAYMENT_MINTS[i].mint] = mintInfo
      } catch (e: any) {
        setError(`${e}`)
      }
    }
    setPaymentMintInfos(paymentMintInfoMap)
    setRefreshing(false)
  }

  useEffect(() => {
    refreshPaymentMints()
  }, [ctx.connection])

  return (
    <PaymentMintsContext.Provider
      value={{
        paymentMintInfos,
        refreshPaymentMints,
        refreshing,
        error,
      }}
    >
      {children}
    </PaymentMintsContext.Provider>
  )
}

export function usePaymentMints(): PaymentMintsContextValues {
  const context = useContext(PaymentMintsContext)
  return context
}
