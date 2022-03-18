import styled from '@emotion/styled'

import { LogoTitled } from '../common/LogoTitled'

export const PoweredByFooter = () => {
  return (
    <div
      style={{
        margin: '0px auto',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
      }}
    >
      <StyledLogo>
        <div>POWERED BY</div>
        <div>
          <LogoTitled />
        </div>
      </StyledLogo>
    </div>
  )
}

const StyledLogo = styled.div`
  display: flex;
  gap: 5px;
  font-size: 15px;
  svg {
    height: 14px;
  }
`
