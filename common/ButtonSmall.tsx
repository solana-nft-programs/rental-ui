import { css } from '@emotion/react'
import { lighten } from 'polished'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useState } from 'react'
import { LoadingSpinner } from 'rental-components/common/LoadingSpinner'

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: JSX.Element | string
  className?: string
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
}

export const ButtonSmall: React.FC<Props> = ({
  children,
  onClick,
  className,
  loading,
  disabled,
  ...props
}: Props) => {
  const [loadingClick, setLoadingClick] = useState(false)
  const { config } = useProjectConfig()
  return (
    <div
      {...props}
      className={`flex items-center justify-center gap-1 rounded-xl border-[0px] border-border px-3 py-2 text-xs transition-all ${className} ${
        disabled ? 'cursor-default' : 'cursor-pointer'
      }`}
      css={css`
        white-space: break-spaces;
        background: ${lighten(0.15, config.colors.main)};
        opacity: ${disabled ? '.5' : '1'};
        box-shadow: inset 2px 2px rgba(255, 255, 255, 0.1);
        &:hover {
          background: ${!disabled ? '#1a1a1a' : ''};
          box-shadow: none;

      `}
      onClick={async () => {
        if (!onClick) return
        try {
          setLoadingClick(true)
          await onClick()
        } finally {
          setLoadingClick(false)
        }
      }}
    >
      {loadingClick || loading ? <LoadingSpinner height="25px" /> : children}
    </div>
  )
}
