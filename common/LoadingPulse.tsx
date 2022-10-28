import styled from '@emotion/styled'
import type { ReactChild } from 'react'
import React from 'react'

export const StyledPulse = styled.div`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;

  .ripple {
    position: absolute;
    border: 4px solid #fff;
    opacity: 0;
    width: 0;
    height: 0;
    border-radius: 50%;
    -webkit-animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
    -moz-animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
    -o-animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
    animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
  }

  .ripple:nth-child(2) {
    animation-delay: -0.8s;
  }

  @keyframes lds-ripple {
    0% {
      opacity: 0;
      width: 0;
      height: 0;
    }
    5% {
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      width: 100%;
      height: 100%;
    }
  }
`

type hideable = {
  visible?: boolean
}

const StyledChildren = styled.div<hideable>`
  width 100%;
  transition: .3s all;
  transform: ${(props) => (props.visible ? 'scale(1)' : 'scale(0.8)')};
  opacity: ${(props) => (props.visible ? '1' : '0')};
`

export function LoadingPulseWrapped({
  loading,
  children,
}: {
  loading: boolean
  children: ReactChild
}) {
  return (
    <StyledPulse>
      {loading && (
        <>
          <div className="ripple"></div>
          <div className="ripple"></div>
        </>
      )}
      <StyledChildren visible={!loading}>{children}</StyledChildren>
    </StyledPulse>
  )
}

export function LoadingPulse({ loading }: { loading: boolean }) {
  return (
    <StyledPulse>
      {loading && (
        <>
          <div className="ripple"></div>
          <div className="ripple"></div>
        </>
      )}
    </StyledPulse>
  )
}
