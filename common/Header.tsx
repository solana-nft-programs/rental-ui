import { ProfileSmall } from '@cardinal/namespaces-components'
import styled from '@emotion/styled'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { tryPublicKey } from 'api/utils'
import Colors from 'common/colors'
import { useRouter } from 'next/router'
import { lighten } from 'polished'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useProjectConfig } from 'providers/ProjectConfigProvider'
import { useUTCNow } from 'providers/UTCNowProvider'
import { useEffect, useState } from 'react'
import { BiChevronDown } from 'react-icons/bi'
import { IoChevronBack } from 'react-icons/io5'
import { useMediaQuery } from 'react-responsive'
import { getColorByBgColor } from 'rental-components/common/Button'

import { AccountPopover } from './AccountPopover'
import { Airdrop, AirdropSol } from './Airdrop'
import { LoadingPulse } from './LoadingPulse'
import { Popover } from './Popover'

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

export const StyledWalletButton = styled(WalletMultiButton)`
  button {
    background: none;

    &:hover {
      background: none;
    }
  }
  .wallet-adapter-button {
    padding: 0px;
  }
`

export const Header = ({
  tabs,
  homeButton,
  loading,
  transparent,
}: {
  tabs?: { disabled?: boolean; name: string; anchor: string }[]
  homeButton?: boolean
  loading?: boolean
  transparent?: boolean
}) => {
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  const router = useRouter()
  const { clockDrift } = useUTCNow()
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
    <div style={{ height: clockDrift ? '120px' : '88px' }}>
      <div
        className="fixed top-0 z-[100] flex w-full flex-col justify-center shadow-2xl"
        // style={{ background: config.colors.main }}
      >
        <div
          className="flex w-full items-center justify-center rounded-md py-2 text-center"
          style={{
            color: config.colors?.secondary,
            background: lighten(0.15, config.colors.main),
          }}
        >
          <div className="text-xs font-semibold text-yellow-500">
            👀 UI redesign coming soon...
          </div>
        </div>
        {clockDrift && (
          <div
            className="flex w-full items-center justify-center rounded-md py-2 text-center"
            style={{
              color: config.colors?.secondary,
              background: lighten(0.15, config.colors.main),
            }}
          >
            <div className="text-xs font-semibold text-yellow-500">
              Warning{' '}
              <a
                target="_blank"
                rel="noreferrer"
                href="https://status.solana.com/"
                className="text-blue-400"
              >
                Solana
              </a>{' '}
              clock is {Math.floor(clockDrift / 60)} minutes{' '}
              {clockDrift > 0 ? 'behind' : 'ahead'}. Rentals are now shown
              aligned to solana clock
            </div>
          </div>
        )}
        <div
          className="flex w-full items-center justify-between py-6 shadow-2xl"
          style={{ background: transparent ? 'none' : config.colors.main }}
        >
          <div className="flex gap-5 pl-8 text-gray-300">
            <div className="title relative" style={{ marginRight: '40px' }}>
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
                  <div
                    className={`absolute bottom-1 rounded-md bg-gray-600 py-[3px] px-[5px] text-[10px] italic ${
                      ctx.environment.label === 'devnet'
                        ? 'right-[-35px]'
                        : 'right-[-45px]'
                    }`}
                  >
                    {ctx.environment.label === 'devnet' ? 'dev' : 'alpha'}
                  </div>
                </>
              )}
            </div>
            {config.name !== 'default' && !host?.includes(config.name) && (
              <div
                className="mr-2 flex cursor-pointer items-center justify-center text-lg text-white transition-all duration-200 hover:scale-[1.02]"
                onClick={() => {
                  const { cluster } = router.query
                  if (homeButton) {
                    router.push(`/${location.search}#browse`)
                  } else {
                    setProjectConfig('default')
                    router.push(
                      `${location.pathname}${
                        cluster ? `?cluster=${cluster}` : ''
                      }`
                    )
                  }
                }}
              >
                <IoChevronBack size={26} />
                Back
              </div>
            )}
            {wallet.connected &&
              ctx.environment.label === 'devnet' &&
              !isTabletOrMobile && (
                <div className="my-auto flex gap-2">
                  <Airdrop />
                  <AirdropSol />
                </div>
              )}
          </div>
          <div className="absolute left-1/2 w-screen -translate-x-1/2 md:w-auto">
            {tabs && (
              <div
                style={{ background: lighten(0.07, config.colors.main) }}
                className={`flex p-[5px] text-sm shadow-2xl ${
                  showTabs ? 'top-[-50px]' : 'top-[-60vh]'
                } absolute h-[40vh] w-screen flex-col items-center justify-around rounded-none py-20 md:relative md:top-0 md:h-auto md:w-auto md:translate-x-0 md:flex-row md:rounded-[20px] md:p-[5px]`}
              >
                {tabs.map(({ disabled, name, anchor }) => (
                  <div
                    className={`w-[150px] rounded-[20px] px-[20px] py-[10px] text-center ${
                      tab === anchor ? '' : ''
                    } ${
                      disabled ? 'opacity-25' : 'cursor-pointer'
                    } transition-all hover:brightness-125`}
                    key={anchor}
                    style={{
                      backgroundColor:
                        tab === anchor
                          ? config.colors.secondary
                          : lighten(0.07, config.colors.main),
                      color:
                        tab === anchor
                          ? getColorByBgColor(config.colors.secondary)
                          : getColorByBgColor(config.colors.main),
                    }}
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
                  </div>
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
              </div>
            )}
          </div>
          <div className="right pr-8">
            {wallet.connected && wallet.publicKey ? (
              isTabletOrMobile ? (
                <Hamburger
                  className="hamb"
                  onClick={() => setShowTabs(!showTabs)}
                >
                  <span className="hamb-line"></span>
                </Hamburger>
              ) : (
                <Popover
                  offset={[-30, 20]}
                  placement="bottom-end"
                  content={<AccountPopover />}
                >
                  <div className="flex cursor-pointer gap-2 text-gray-500 transition duration-200 hover:text-gray-300">
                    <ProfileSmall
                      dark
                      connection={ctx.connection}
                      address={wallet.publicKey}
                    />
                    <BiChevronDown className="h-10 text-[25px] hover:scale-105" />
                  </div>
                </Popover>
              )
            ) : (
              <StyledWalletButton
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
        </div>
      </div>
    </div>
  )
}
