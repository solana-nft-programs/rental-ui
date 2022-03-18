import { css } from '@emotion/react'
import styled from '@emotion/styled'
import {
  AiFillCheckCircle,
  AiFillExclamationCircle,
  AiFillInfoCircle,
  AiFillWarning,
} from 'react-icons/ai'

export const Alert = ({
  type,
  showIcon,
  message,
  style,
  icon,
}: {
  type: 'success' | 'info' | 'warning' | 'error'
  showIcon?: boolean
  message: React.ReactNode
  icon?: React.ReactNode
  style: React.CSSProperties
}) => {
  return (
    <StyledAlert type={type} style={style}>
      {showIcon &&
        (icon ?? (
          <AlertIcon type={type}>
            {
              {
                info: <AiFillInfoCircle />,
                warning: <AiFillWarning />,
                success: <AiFillCheckCircle />,
                error: <AiFillExclamationCircle />,
              }[type]
            }
          </AlertIcon>
        ))}
      {message}
    </StyledAlert>
  )
}

const AlertIcon = styled.div<{
  type: 'success' | 'info' | 'warning' | 'error'
}>`
  margin-right: 8px;
  ${({ type = 'info' }) => {
    return {
      info: css`
        color: #1890ff;
      `,
      warning: css`
        color: #faad14;
      `,
      success: css`
        color: #52c41a;
      `,
      error: css`
        color: #ff4d4f;
      `,
    }[type]
  }}
`

const StyledAlert = styled.div<{
  type: 'success' | 'info' | 'warning' | 'error'
}>`
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-variant: tabular-nums;
  line-height: 1.5715;
  list-style: none;
  font-feature-settings: 'tnum';
  position: relative;
  display: flex;
  align-items: center;
  padding: 8px 15px;
  word-wrap: break-word;
  border-radius: 2px;
  ${({ type = 'info' }) => {
    return {
      info: css`
        background-color: #e6f7ff;
        border: 1px solid #91d5ff;
      `,
      warning: css`
        background-color: #fffbe6;
        border: 1px solid #ffe58f;
      `,
      success: css`
        background-color: #f6ffed;
        border: 1px solid #b7eb8f;
      `,
      error: css`
        background-color: #fff2f0;
        border: 1px solid #ffccc7;
      `,
    }[type]
  }}
`
