import { css } from '@emotion/react'
import { useState } from 'react'

import { LoadingSpinner } from './LoadingSpinner'

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  loading?: boolean
  disabled?: boolean
  accented?: boolean
  inlineLoader?: boolean
  loader?: React.ReactElement
}

export const ButtonSmall: React.FC<Props> = ({
  children,
  onClick,
  className,
  loading,
  disabled,
  inlineLoader,
  loader,
  ...props
}: Props) => {
  const [loadingClick, setLoadingClick] = useState(false)
  const loaderElement = loader || (
    <LoadingSpinner height="24" className="flex items-center justify-center" />
  )
  return (
    <div
      {...props}
      className={`flex items-center justify-center gap-1 rounded-xl border-[0px] border-border bg-white bg-opacity-10 px-3 py-2 transition-all ${className} ${
        disabled
          ? 'cursor-default opacity-50'
          : 'cursor-pointer hover:bg-opacity-5'
      }`}
      css={css`
        white-space: break-spaces;
      `}
      onClick={async (e) => {
        if (!onClick) return
        try {
          setLoadingClick(true)
          await onClick(e)
        } finally {
          setLoadingClick(false)
        }
      }}
    >
      {loading || loadingClick ? (
        inlineLoader ? (
          <div className="flex items-center justify-center gap-2">
            {loaderElement}
            {children}
          </div>
        ) : (
          loaderElement
        )
      ) : (
        children
      )}
    </div>
  )
}
