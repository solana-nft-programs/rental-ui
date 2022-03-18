import styled from '@emotion/styled'
import { lighten } from 'polished'
import { FaCheckCircle } from 'react-icons/fa'

import { LoadingSpinner } from '../common/LoadingSpinner'

interface Props
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  loading?: boolean
  complete?: boolean
  message?: React.ReactNode
  footer?: React.ReactNode
}

export const ButtonWithFooter: React.FC<Props> = ({
  footer,
  children,
  disabled,
  loading,
  complete,
  message,
  ...props
}: Props) => {
  return (
    <BottomArea>
      {message && message}
      <BigButton disabled={disabled} {...props}>
        {loading ? <LoadingSpinner /> : complete ? <FaCheckCircle /> : children}
      </BigButton>
      <FooterText>{footer}</FooterText>
    </BottomArea>
  )
}

export const BottomArea = styled.div`
  margin-top: 20px;
  left: 28px;
  right: 28px;
  bottom: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
`

export const FooterText = styled.div`
  font-size: 12px;
  line-height: 15px;
  letter-spacing: -0.02em;
  color: #696969;
  & > a {
    color: #696969;
    font-weight: bold;
  }
`

export const BigButton = styled.button`
  border: none;
  outline: none;
  border-radius: 16px;
  height: 55px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  line-height: 20px;
  text-align: center;
  background: #000000;
  color: #fff;
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};

  opacity: ${({ disabled }) => (disabled ? 0.3 : 1)};
  &:hover {
    background: ${({ disabled }) => (disabled ? '' : lighten(0.133, '#000'))};
  }
  &:active {
    background: ${({ disabled }) => (disabled ? '' : lighten(0.212, '#000'))};
  }
`
