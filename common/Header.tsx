import { AddressImage, DisplayAddress } from '@cardinal/namespaces-components'
import styled from '@emotion/styled'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  useWalletModal,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui'
import { tryPublicKey } from 'api/utils'
import Colors from 'common/colors'
import { useRouter } from 'next/router'
import { lighten } from 'polished'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useEffect, useState } from 'react'
import { HiUserCircle } from 'react-icons/hi'
import { IoChevronBack } from 'react-icons/io5'
import { useMediaQuery } from 'react-responsive'
import { getColorByBgColor } from 'rental-components/common/Button'

import { Airdrop, AirdropSol } from './Airdrop'
import { LoadingPulse } from './LoadingPulse'
import { shortPubKey } from './utils'

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
    @media (max-width: 1224px) {
      width: 100vw;
    }
  }

  .title {
    color: rgba(255, 255, 255, 0.8);
    position: relative;

    .subscript {
      font-size: 10px;
      font-style: italic;
      bottom: 5px;
      right: -35px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      padding: 3px 5px;
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
  const { config, setProjectConfig } = useProjectConfig()
  const { host } = router.query

  useEffect(() => {
    if (config.colors) {
      Colors.navBg = config.colors.main
      Colors.secondary = config.colors.secondary
    }
  }, [config])

  useEffect(() => {
    const anchor = router.asPath.split('#')[1]
    if (anchor !== tab) setTab(anchor || 'wallet')
  }, [router.asPath, tab])

  const walletAddressFormatted = wallet?.publicKey
    ? shortPubKey(wallet?.publicKey)
    : ''

  const issuer = tryPublicKey(config.issuer?.publicKeyString)
  return (
    <StyledHeader
      style={{ backgroundColor: Colors.navBg }}
      isTabletOrMobile={isTabletOrMobile}
    >
      <div className="left pl-8">
        <div className="title" style={{ marginRight: '40px' }}>
          {issuer ? (
            <>
              <div className="flex cursor-pointer gap-2">
                <AddressImage
                  connection={ctx.connection}
                  address={issuer}
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
                        <HiUserCircle
                          style={{ height: '100%', width: '100%' }}
                        />
                      </div>
                    </div>
                  }
                />
                <div>
                  <div className="text-white">
                    <DisplayAddress
                      connection={ctx.connection}
                      address={issuer}
                      height="21px"
                      style={{ maxWidth: '120px' }}
                      dark={true}
                    />
                  </div>
                  <div
                    className="flex gap-2"
                    style={{ color: Colors.lightGray }}
                  >
                    {shortPubKey(issuer)}
                    <div
                      className="subscript"
                      style={{ bottom: 0, right: -42 }}
                    >
                      {ctx.environment.label === 'devnet' ? 'DEV' : 'vault'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <a
                className="cursor-pointer"
                rel="noreferrer"
                target="_blank"
                href={config.websiteUrl}
              >
                <img className="h-9 w-auto" src={config.logoImage} alt="logo" />
              </a>
              <div className="subscript absolute">
                {ctx.environment.label === 'devnet' ? 'DEV' : 'alpha'}
              </div>
            </>
          )}
        </div>
        {wallet.connected &&
          ctx.environment.label === 'devnet' &&
          !isTabletOrMobile && (
            <div className="flex gap-2">
              <Airdrop />
              <AirdropSol />
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
        {config.name !== 'default' && !host?.includes(config.name) && (
          <div
            className="mr-2 flex cursor-pointer items-center justify-center text-lg text-white"
            onClick={() => setProjectConfig('default')}
          >
            <IoChevronBack size={26} />
            Back
          </div>
        )}
        {wallet.connected ? (
          isTabletOrMobile ? (
            <Hamburger className="hamb" onClick={() => setShowTabs(!showTabs)}>
              <span className="hamb-line"></span>
            </Hamburger>
          ) : (
            <div
              className="flex cursor-pointer gap-2"
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
              <div>
                <div className="text-white">
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
            </div>
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
