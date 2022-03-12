import styled from '@emotion/styled'
import { css } from '@emotion/react'
import lighten from 'polished/lib/color/lighten'

export const Button = styled.button<{
  variant: 'primary' | 'secondary' | 'tertiary'
  boxShadow?: boolean
  disabled?: boolean
  bgColor?: string
}>`
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: ${({ disabled }) => !disabled && 'pointer'};
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};
  border: none;
  outline: none;
  height: 26px;
  font-size: 12px;
  mix-blend-mode: normal;
  box-shadow: ${({ boxShadow }) =>
    boxShadow ? '0px 4px 4px rgba(0, 0, 0, 0.25)' : ''};
  border-radius: 4px;
  padding: 0 12px;
  transition: 0.2s background;
  ${({ variant = 'primary', disabled, bgColor = undefined }) => {
    if (disabled) return
    return bgColor
      ? css`
          background: ${bgColor};
          color: ${getColorByBgColor(bgColor)};
          &:hover {
            background: ${lighten(0.1, bgColor)}};
          }
        `
      : variant === 'primary'
      ? css`
          background: rgb(29, 155, 240);
          color: #fff;
          &:hover {
            background: ${lighten(0.1, 'rgb(29, 155, 240)')}};
          }
        `
      : variant === 'secondary'
      ? css`
          background: #000;
          color: #fff;
          &:hover {
            background: ${lighten(0.1, '#000')};
          }
        `
      : css`
          background: rgb(255, 255, 255, 0.15);
          color: #fff;
          &:hover {
            background: ${lighten(0.05, '#000')};
          }
        `
  }}
  & > span {
    font-size: 14px;
  }
`

const getColorByBgColor = (bgColor) => {
  if (!bgColor) {
    return ''
  }
  return parseInt(bgColor.replace('#', ''), 16) > 0xffffff / 2 ? '#000' : '#fff'
}
