import { contrastColorMode } from '@cardinal/common'
import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { darken, lighten } from 'polished'
import { useState } from 'react'

import { CONFIG } from './Color'
import { LoadingSpinner } from './LoadingSpinner'

export type ButtonProps = {
  variant: 'primary' | 'secondary' | 'tertiary'
  square?: boolean
  disabled?: boolean
  bgColor?: string
}

export const StyledButton = styled.button<ButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: ${({ disabled }) => !disabled && 'pointer'};
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};
  border: none;
  outline: none;
  font-size: 12px;
  mix-blend-mode: normal;
  border-radius: 8px;
  padding: 4px 12px;
  min-height: 36px;
  width: ${({ square }) => (square ? '36px' : '100px')};
  white-space: break-spaces;
  transition: background 0.2s, border 0.2s;
  ${({ variant = 'primary', disabled, bgColor = undefined }) => {
    return bgColor
      ? css`
          background: ${bgColor};
          color: ${contrastColorMode(bgColor)[0]};
          &:hover {
            background: ${!disabled && lighten(0.1, bgColor)}};
          }
        `
      : variant === 'primary'
      ? css`
          background: ${CONFIG.colors.primary};
          color: #fff;
          &:hover {
            background: ${!disabled && darken(0.05, CONFIG.colors.primary)}};
          }
        `
      : variant === 'secondary'
      ? css`
          background: #000;
          color: #fff;
          border: 1px solid ${CONFIG.colors['medium-4']};
          &:hover {
            border: ${!disabled && `1px solid ${CONFIG.colors.primary}`};
          }
        `
      : css`
          background: rgb(255, 255, 255, 0.15);
          color: #fff;
          &:hover {
            background: ${!disabled && lighten(0.05, '#000')};
          }
        `
  }}
  background: ${({ disabled }) => (disabled ? CONFIG.colors['medium-4'] : '')};
`

export const Button = ({
  text,
  onClick,
  className,
  icon,
  count,
  ...buttonProps
}: {
  text: string
  icon?: JSX.Element
  count?: number
  className?: string
  onClick: () => void
} & ButtonProps) => {
  const [loading, setLoading] = useState(false)

  return (
    <StyledButton
      {...buttonProps}
      className={className}
      onClick={async () => {
        try {
          setLoading(true)
          await onClick()
        } finally {
          setLoading(false)
        }
      }}
    >
      {loading ? (
        <LoadingSpinner height="25px" />
      ) : (
        <div className="flex items-center justify-center gap-1">
          {text && <div>{text}</div>}
          {count && (
            <div
              className="h-4 w-4 rounded-full bg-white text-xs text-transparent"
              style={{ color: CONFIG.colors.primary }}
            >
              {count}
            </div>
          )}
          {icon && icon}
        </div>
      )}
    </StyledButton>
  )
}
