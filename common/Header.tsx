import { ProfileSmall } from '@cardinal/namespaces-components'
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
import { IoChevronBack } from 'react-icons/io5'
import { useMediaQuery } from 'react-responsive'
import { getColorByBgColor } from 'rental-components/common/Button'

import { Airdrop, AirdropSol } from './Airdrop'
import { LoadingPulse } from './LoadingPulse'

export const StyledHeader = styled.div<{ isTabletOrMobile: boolean }>`
  z-index: 100;
  position: fixed;
  justify-content: space-between;
  display: flex;
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
  &:hover {
    transition: 0.3s all;
    background: ${({ disabled }) =>
      disabled ? '' : lighten(0.07, Colors.secondary)};
  }
`

export const Header = ({
  tabs,
  homeButton,
  loading,
}: {
  tabs?: { disabled?: boolean; name: string; anchor: string }[]
  homeButton?: boolean
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

  const issuer = tryPublicKey(config.issuer?.publicKeyString)
  return (
    <StyledHeader
      isTabletOrMobile={isTabletOrMobile}
      className="shadow-2xl"
      style={{ background: config.colors.main }}
    >
      <div className="left pl-8">
        <div className="title" style={{ marginRight: '40px' }}>
          {issuer ? (
            <>
              <div className="flex cursor-pointer gap-2">
                <ProfileSmall
                  dark
                  connection={ctx.connection}
                  address={issuer}
                />
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
                <img
                  className="max-h-9 w-full max-w-[160px]"
                  src={config.logoImage}
                  alt="logo"
                />
              </a>

              {ctx.environment.label === 'devnet' ? (
                <div className="subscript absolute right-[-35px]">dev</div>
              ) : (
                <div className="subscript absolute right-[-45px]">alpha</div>
              )}
            </>
          )}
        </div>
        {config.name !== 'default' && !host?.includes(config.name) && (
          <div
            className="mr-2 flex cursor-pointer items-center justify-center text-lg text-white transition-all duration-200 hover:scale-[1.02]"
            onClick={() =>
              homeButton
                ? router.push(`/${location.search}#browse`)
                : setProjectConfig('default')
            }
          >
            <IoChevronBack size={26} />
            Back
          </div>
        )}
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
            style={{ background: lighten(0.07, config.colors.main) }}
            show={showTabs}
            className="shadow-2xl"
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
        {wallet.connected && wallet.publicKey ? (
          isTabletOrMobile ? (
            <Hamburger className="hamb" onClick={() => setShowTabs(!showTabs)}>
              <span className="hamb-line"></span>
            </Hamburger>
          ) : (
            <div
              className="flex cursor-pointer gap-2"
              onClick={() => setVisible(true)}
            >
              <ProfileSmall
                dark
                connection={ctx.connection}
                address={wallet.publicKey}
              />
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
