import React, { useState, useContext, useEffect, ReactChild } from 'react'
import { Alert } from 'antd'

const ErrorContext: React.Context<null | any> = React.createContext<null | any>(
  null
)

export function ErrorProvider({ children }: { children: ReactChild }) {
  const [error, setError] = useState(null)
  const [styledError, setStyledError] = useState(null)
  useEffect(() => {
    setStyledError(
      error && (
        <Alert
          style={{ marginBottom: '10px' }}
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
        />
      )
    )
  }, [error])
  return (
    <ErrorContext.Provider
      value={{
        setError,
        styledError,
      }}
    >
      {children}
    </ErrorContext.Provider>
  )
}

export function useError() {
  const ctx = useContext(ErrorContext)
  return ctx ? [ctx.styledError, ctx.setError] : []
}
