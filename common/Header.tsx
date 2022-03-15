import {
  WalletMultiButton,
  useWalletModal,
} from '@solana/wallet-adapter-react-ui'
import styled from '@emotion/styled'
import Colors from 'common/colors'
import { LoadingPulse } from './LoadingPulse'
import { useEffect, useState } from 'react'
import { useMediaQuery } from 'react-responsive'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { AddressImage, DisplayAddress } from '@cardinal/namespaces-components'
import { shortPubKey } from './utils'
import { HiUserCircle } from 'react-icons/hi'
import { Airdrop } from './Airdrop'
import { useRouter } from 'next/router'
import { useProjectConfigData } from 'providers/ProjectConfigProvider'
import lighten from 'polished/lib/color/lighten'
import { getColorByBgColor } from 'rental-components/common/Button'

export const StyledHeader = styled.div<{ isTabletOrMobile: boolean }>`
  z-index: 100;
  position: fixed;
  transition-delay: 10s;
  justify-content: space-between;
  display: flex;
  transition: 2s;
  top: 0;
  width: 100%;
  height: 100px;
  align-items: center;

  .left {
    display: flex;
    align-items: center;
    gap: 18px;

    img {
      height: 35px;
      width: auto;
    }
  }

  .right {
    position: relative;
    display: flex;
    align-items: center;
    gap: 18px;
    justify-content: flex-end;

    button {
      background: none;

      &:hover {
        background: none;
      }
    }
  }

  .center {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.8);
    font-weight: 200;
    @media (max-width: 1224px) {
      width: 100vw;
    }
  }

  .title {
    color: rgba(255, 255, 255, 0.8);
    font-size: 40px;
    position: relative;

    .subscript {
      font-size: 10px;
      font-style: italic;
      position: absolute;
      bottom: 5px;
      right: -35px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      padding: 3px 5px;
    }

    img {
      width: auto;
      max-width: none;
    }
  }

  .vote {
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.8);
    padding: 4px 10px;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: 0.3s;
    margin-top: 10px;
    display: inline-block;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 1);
    }
  }

  .back {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.3s;
    font-size: 20px;

    i {
      transition: 0.3s;
      color: rgba(255, 255, 255, 0.8);
      margin-right: 5px;
      margin-top: 3px;
    }
    span {
      font-size: 24px;
      color: rgba(255, 255, 255, 0.8);
    }
    &:hover {
      i {
        margin-right: 7px;
        color: rgba(255, 255, 255, 0.8);
      }
      span {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }

  .wallet-adapter-button {
    padding: 0px;
  }
`

export const Hamburger = styled.div`
    cursor: pointer;
    padding: 5px 0px;
    margin-right: 10px;

    .hamb-line {
      background: ${Colors.white};
      display: block;
      height: 2px;
      position: relative;
      width: 24px;
    }

    .hamb-line::before,
    .hamb-line::after {
      background: ${Colors.white};
      content: '';
      display: block;
      height: 100%;
      position: absolute;
      transition: all 0.2s ease-out;
      width: 100%;
    }
    .hamb-line::before {
      top: 5px;
    }
    .hamb-line::after {
      top: -5px;
    }
  }
`

// background-color: ${lighten(0.1, Colors.navBg)};
export const StyledTabs = styled.div<{ show: boolean }>`
  font-size: 13px;

  @media (min-width: 1224px) {
    display: flex;
    margin: 30px auto;
    padding: 5px;
    position: relative;
    background-color: ${Colors.tabsBg};
    border-radius: 20px;
    align-items: center;
    gap: 5px;

    .vline {
      width: 1px;
      height: 20px;
      background: ${Colors.lightGray};
      opacity: 0;
    }
  }
  @media (max-width: 1224px) {
    transition: 0.2s all;
    display: flex;
    height: 40vh;
    width: 100vw;
    position: absolute;
    gap: 10px;
    top: ${({ show }) => (show ? '-50px' : '-60vh')};
    text-align: center;
    align-items: center;
    flex-direction: column;
    justify-content: space-around;
    padding: 20% 0px;
    background-color: ${Colors.navBg};
  }
`

export const StyledTab = styled.div<{
  selected: boolean
  disabled: boolean | undefined
}>`
  border-radius: 20px;
  background: ${({ selected }) => (selected ? Colors.secondary : 'none')};
  opacity: ${({ disabled }) => (disabled ? 0.25 : 1)};
  color: ${({ selected }) =>
    selected
      ? getColorByBgColor(Colors.secondary)
      : getColorByBgColor(Colors.navBg)};
  text-align: center;
  width: 150px;
  padding: 10px 20px;
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  transition: 0.3s all;
  &:hover {
    background: ${({ disabled }) =>
      disabled ? '' : lighten(0.1, Colors.secondary)};
  }
`

const StyledProfile = styled.div`
  display: flex;
  gap: 10px;
  .info {
    color: white;
    font-size: 14px;
  }
`

export const Header = ({
  tabs,
  loading,
}: {
  tabs?: { disabled?: boolean; name: string; anchor: string }[]
  loading?: boolean
}) => {
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  const router = useRouter()
  const { setVisible } = useWalletModal()
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })
  const [showTabs, setShowTabs] = useState(false)
  const [tab, setTab] = useState<string>('wallet')
  const { logoImage, colors } = useProjectConfigData()

  useEffect(() => {
    if (colors) {
      Colors.navBg = colors.main
      Colors.secondary = colors.secondary
    }
  }, [colors])

  useEffect(() => {
    const anchor = router.asPath.split('#')[1]
    if (anchor != tab) setTab(anchor || 'wallet')
  }, [router.asPath])

  const walletAddressFormatted = wallet?.publicKey
    ? shortPubKey(wallet?.publicKey)
    : ''

  return (
    <StyledHeader
      style={{ backgroundColor: Colors.navBg }}
      isTabletOrMobile={isTabletOrMobile}
    >
      <div className="left pl-8">
        <div className="title">
          <img src={logoImage} />
          <div className="subscript">
            {ctx.environment.label === 'devnet' ? 'DEV' : 'alpha'}
          </div>
        </div>
        {wallet.connected &&
          ctx.environment.label === 'devnet' &&
          !isTabletOrMobile && (
            <div style={{ marginLeft: '40px' }}>
              <Airdrop />
            </div>
          )}
      </div>
      <div className="center">
        {tabs && (
          <StyledTabs
            // show={!isTabletOrMobile || showTabs}
            show={showTabs}
          >
            {tabs.map(({ disabled, name, anchor }) => (
              <StyledTab
                key={anchor}
                selected={tab === anchor}
                className="tab"
                disabled={disabled}
                onClick={() => {
                  if (disabled) return
                  setTab(anchor)
                  setShowTabs(false)
                  router.push(
                    `${location.pathname}${location.search}#${anchor}`
                  )
                }}
              >
                {name}
              </StyledTab>
            ))}
            <div
              style={{
                position: 'absolute',
                color: 'white',
                width: '30px',
                height: '30px',
                right: -50,
              }}
            >
              <LoadingPulse loading={loading ?? false} />
            </div>
          </StyledTabs>
        )}
      </div>
      <div className="right pr-8">
        {/* <div
          style={{
            position: 'absolute',
            color: 'white',
            width: '30px',
            height: '30px',
            left: isTabletOrMobile ? 'none' : -50,
            top: isTabletOrMobile ? 50 : 8,
          }}
        >
          <LoadingPulse loading={loading ?? false} />
        </div> */}
        {wallet.connected ? (
          isTabletOrMobile ? (
            <Hamburger className="hamb" onClick={() => setShowTabs(!showTabs)}>
              <span className="hamb-line"></span>
            </Hamburger>
          ) : (
            <StyledProfile
              style={{ cursor: 'pointer' }}
              onClick={() => setVisible(true)}
            >
              <AddressImage
                connection={ctx.connection}
                address={wallet.publicKey || undefined}
                height="40px"
                width="40px"
                dark={true}
                placeholder={
                  <div
                    style={{
                      color: 'white',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ height: '40px', width: '40px' }}>
                      <HiUserCircle style={{ height: '100%', width: '100%' }} />
                    </div>
                  </div>
                }
              />
              <div className="info">
                <div>
                  <DisplayAddress
                    style={{ pointerEvents: 'none' }}
                    connection={ctx.connection}
                    address={wallet.publicKey || undefined}
                    height="12px"
                    width="100px"
                    dark={true}
                  />
                </div>
                <div style={{ color: Colors.lightGray }}>
                  {walletAddressFormatted}
                </div>
              </div>
            </StyledProfile>
          )
        ) : (
          <WalletMultiButton
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '14px',
              zIndex: 10,
              height: '38px',
              border: 'none',
              background: 'none',
              backgroundColor: 'none',
            }}
          />
        )}
      </div>
    </StyledHeader>
  )
}
