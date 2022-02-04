import { css, Global } from '@emotion/react'
import styled from '@emotion/styled'
import { DialogContent, DialogOverlay } from '@reach/dialog'
import { animated, useSpring, useTransition } from '@react-spring/web'
import darken from 'polished/lib/color/darken'
import React from 'react'
import { isMobile } from 'react-device-detect'
import { useGesture } from 'react-use-gesture'
import Colors from 'common/colors'

import { BackIcon, CloseIcon } from '../common/icons'

export interface ModalProps {
  children: React.ReactNode
  isOpen: boolean
  onDismiss: () => void
  darkenOverlay?: boolean
  topArea?: boolean
  fitContent?: boolean
  borderRadius?: string
  dark?: boolean

  onBack?: () => void
  hideCloseButton?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  children,
  isOpen,
  onDismiss,
  darkenOverlay = true,
  topArea = true,
  fitContent = false,
  borderRadius = '8px',
  dark = false,

  onBack,
  hideCloseButton = false,
}: ModalProps) => {
  const fadeTransition = useTransition(isOpen, {
    config: { duration: 150 },
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  })

  const [{ y }, set] = useSpring(() => ({
    y: 0,
    config: { mass: 1, tension: 210, friction: 20 },
  }))
  const bind = useGesture({
    onDrag: (state) => {
      set({
        y: state.down ? state.movement[1] : 0,
      })
      if (
        state.movement[1] > 300 ||
        (state.velocity > 3 && state.direction[1] > 0)
      ) {
        onDismiss()
      }
    },
  })

  return (
    <>
      {/* @reach/dialog/styles.css */}
      <Global
        styles={css`
          :root {
            --reach-dialog: 1;
          }
          [data-reach-dialog-overlay] {
            background: hsla(0, 0%, 0%, 0.33);
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            overflow: auto;
            z-index: 100;
          }
          [data-reach-dialog-content] {
            margin: 10vh auto;
            background: white;
            padding: 2rem;
            outline: none;
          }
        `}
      />
      {fadeTransition(
        (props, item) =>
          item && (
            <StyledDialogOverlay
              style={props}
              isOpen={isOpen || props.opacity.get() !== 0}
              onDismiss={onDismiss}
              darkenOverlay={darkenOverlay}
            >
              <ModalWrapper
                borderRadius={borderRadius}
                fitContent={fitContent}
                dark={dark}
                aria-label="dialog content"
                {...(isMobile
                  ? {
                      ...bind(),
                      style: {
                        width: fitContent ? 'fit-content !important' : '100%',
                        transform: y.to(
                          (n) => `translateY(${n > 0 ? n : 0}px)`
                        ),
                      },
                    }
                  : {
                      style: {
                        width: fitContent ? 'fit-content !important' : '100%',
                      },
                    })}
              >
                {topArea && (
                  <TopArea>
                    {onBack ? (
                      <ButtonIcon
                        href="#"
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          onBack()
                        }}
                      >
                        <BackIcon />
                      </ButtonIcon>
                    ) : (
                      <div />
                    )}
                    {hideCloseButton ? (
                      <div />
                    ) : (
                      <ButtonIcon
                        href="#"
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          onDismiss()
                        }}
                      >
                        <CloseIcon />
                      </ButtonIcon>
                    )}
                  </TopArea>
                )}
                <Content>{children}</Content>
              </ModalWrapper>
            </StyledDialogOverlay>
          )
      )}
    </>
  )
}

const TopArea = styled.div`
  padding: 12px 16px 0px 16px;
  top: 12px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const ButtonIcon = styled.a`
  flex: 0 0 24px;
  color: #ccd2e3;
  &:hover {
    color: ${darken(0.1, '#ccd2e3')};
  }
  transition: 0.1s ease;
`

const Content = styled.div``

const ModalWrapper = styled(animated(DialogContent))<{
  fitContent?: boolean
  borderRadius?: string
  dark?: boolean
}>`
  * {
    box-sizing: border-box;
  }
  font-family: SFHello, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
    'Segoe UI Symbol';
  position: relative;
  box-shadow: 0px 4px 16px rgba(207, 207, 207, 0.25);
  max-width: 560px;
  width: ${({ fitContent }) => (fitContent ? 'fit-content' : '100%')};
  border-radius: ${({ borderRadius }) => borderRadius ?? '8px'};
  background: ${({ dark }) => (dark ? 'rgb(26, 27, 32)' : '#FFF')};
  color: #696969;
  font-weight: normal;
  font-size: 12px;
  line-height: 15px;
  letter-spacing: -0.02em;
  color: #696969;
`

const StyledDialogOverlay = styled(animated(DialogOverlay), {
  shouldForwardProp(prop) {
    return prop !== 'darkenOverlay'
  },
})<{
  darkenOverlay: boolean
}>`
  [data-reach-dialog-content] {
    padding: 0;
  }
  ${({ darkenOverlay }) =>
    darkenOverlay
      ? css`
          background: rgba(0, 0, 0, 0.55);
        `
      : css`
          background: none;
        `}
`
